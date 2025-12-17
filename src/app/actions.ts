'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { generateScript } from '@/services/ai-agents'
import { CreateProjectInput } from '@/types'
import { cookies } from "next/headers"
import { Scene } from '@/types'
import { ComfyUiClient } from '@/services/comfyui-client'
import { createAdminClient } from '@/lib/supabase/admin'


export async function createProject(data: CreateProjectInput) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Unauthorized' }
  }

  // 1. Create Project Record
  const { data: project, error } = await supabase
    .from('projects')
    .insert({
      user_id: user.id,
      name: data.name,
      theme: data.theme,
      style: data.style,
      constraints: data.constraints,
      max_duration: data.maxDuration,
      generation_mode: data.generationMode,
      scene_count: data.sceneCount,
      status: 'script'
    })
    .select()
    .single()

  if (error || !project) {
    return { error: 'Failed to create project' }
  }

  console.log('Created project:', project.id);

  // 2. Trigger AI Generation (Mock)
  try {
    const script = await generateScript(data.theme, data.style, data.sceneCount, data.maxDuration)
    const scenesToInsert = script.scenes.map((scene: Scene) => ({
      project_id: project.id,
      order: scene.order,
      script: scene.script,
      image_prompt: scene.imagePrompt,
      video_prompt: scene.videoPrompt,
      start_at: scene.startAt,
      end_at: scene.endAt,
      status: 'pending'
    }))

    await supabase.from('scenes').insert(scenesToInsert);

  } catch (err) {
    console.error('AI Generation failed', err)
    await supabase.from('projects').update({ status: 'failed' }).eq('id', project.id)
    return { error: 'AI Generation failed' }
  }

  revalidatePath('/dashboard')
  redirect(`/projects/${project.id}`)
}

export async function deleteAccount() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.id) {
    return { error: 'Unauthorized' }
  }

  // Delete user from Supabase (Cascade should handle related data)
  const { error } = await supabase.from('users').delete().eq('id', user.id)

  if (error) {
    return { error: 'Failed to delete account' }
  }

  // Sign out not handled here, client side should handle redirect
  return { success: true }
}

export async function signOutAction() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  await supabase.auth.signOut()
  redirect('/login')
}

export async function generateImagesForProject(projectId: string) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const adminSupabase = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Unauthorized' }
  }

  const { data: scenes, error: scenesError } = await supabase
    .from('scenes')
    .select('*')
    .eq('project_id', projectId)

  if (scenesError) {
    return { error: 'Failed to load scenes' }
  }

  if (!scenes || scenes.length === 0) {
    return { error: 'No scenes to generate images for' }
  }

  try {
    for (const scene of scenes as Scene[]) {
      if (!scene.imagePrompt) {
        continue
      }

      const comfyuiClient = new ComfyUiClient()
      await comfyuiClient.connect()
      const images = await comfyuiClient.generateImage({ positive_prompt: scene.imagePrompt })
      await comfyuiClient.disconnect()

      if (!images || images.length === 0) {
        console.error('No images generated for scene', scene.id)
        continue
      }

      const imageBuffer = images[0]
      const fileName = `${projectId}/${scene.id}-${Date.now()}.png`

      const { error: uploadError } = await adminSupabase
        .storage
        .from(process.env.SUPABASE_STORAGE_BUCKET_NAME || 'images')
        .upload(fileName, imageBuffer, {
          contentType: 'image/png',
          upsert: true
        })

      if (uploadError) {
        console.error('Failed to upload image', uploadError)
        continue
      }

      const { data: { publicUrl } } = supabase
        .storage
        .from(process.env.SUPABASE_STORAGE_BUCKET_NAME || 'images')
        .getPublicUrl(fileName)

      const imageUrl = publicUrl

      const { error: updateError } = await supabase
        .from('scenes')
        .update({ image_url: imageUrl, status: 'completed' })
        .eq('id', scene.id)

      if (updateError) {
        console.error('Failed to update scene', scene.id, updateError)
      }
    }

    await supabase
      .from('projects')
      .update({ status: 'image' })
      .eq('id', projectId)
  } catch (error) {
    console.error('Image generation failed', error)
    await supabase
      .from('projects')
      .update({ status: 'failed' })
      .eq('id', projectId)
    return { error: 'Image generation failed' }
  }

  revalidatePath('/projects/[id]', 'page')
  return { success: true }
}

export async function generateVideosForProject(projectId: string) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Unauthorized' }
  }

  const { data: scenes, error: scenesError } = await supabase
    .from('scenes')
    .select('*')
    .eq('project_id', projectId)

  if (scenesError) {
    return { error: 'Failed to load scenes' }
  }

  if (!scenes || scenes.length === 0) {
    return { error: 'No scenes to generate videos for' }
  }

  try {
    for (const scene of scenes as Scene[]) {
      if (!scene.videoPrompt || !scene.imageUrl) {
        continue
      }

      const comfyuiClient = new ComfyUiClient()
      await comfyuiClient.connect()
      const videoUrl = await comfyuiClient.generateVideo({ positive_prompt: scene.videoPrompt })
      await comfyuiClient.disconnect()

      const { error: updateError } = await supabase
        .from('scenes')
        .update({ video_url: videoUrl, status: 'completed' })
        .eq('id', scene.id)

      if (updateError) {
        console.error('Failed to update scene', scene.id, updateError)
      }
    }

    await supabase
      .from('projects')
      .update({ status: 'video' })
      .eq('id', projectId)
  } catch (error) {
    console.error('Video generation failed', error)
    await supabase
      .from('projects')
      .update({ status: 'failed' })
      .eq('id', projectId)
    return { error: 'Video generation failed' }
  }

  revalidatePath('/projects/[id]', 'page')
  return { success: true }
}



export async function generateImageForScene(sceneId: string, referenceImage?: string) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Unauthorized' }
  }

  const { data: scene, error: sceneError } = await supabase
    .from('scenes')
    .select('*')
    .eq('id', sceneId)
    .single()

  if (sceneError || !scene) {
    return { error: 'Scene not found' }
  }

  if (!scene.image_prompt) {
    return { error: 'No image prompt for scene' }
  }

  try {
    const comfyuiClient = new ComfyUiClient()
    await comfyuiClient.connect()

    let images: ArrayBuffer[] = []

    if (referenceImage) {
      console.log('Reference image provided:', referenceImage)
      images = await comfyuiClient.generateImage2Image({ positive_prompt: scene.image_prompt, referenceImage })
    } else {
      images = await comfyuiClient.generateImage({ positive_prompt: scene.image_prompt })
    }

    await comfyuiClient.disconnect()

    if (!images || images.length === 0) {
      return { error: 'No images generated' }
    }

    const imageBuffer = images[0]

    const fileName = `${scene['project_id']}/${scene.id}-${Date.now()}.png`

    const { error: uploadError } = await supabase
      .storage
      .from('images')
      .upload(fileName, imageBuffer, {
        contentType: 'image/png',
        upsert: true
      })

    if (uploadError) {
      console.error('Failed to upload image', uploadError)
      return { error: 'Failed to upload image' }
    }

    const { data: { publicUrl } } = supabase
      .storage
      .from('images')
      .getPublicUrl(fileName)

    const { error: updateError } = await supabase
      .from('scenes')
      .update({ image_url: publicUrl })
      .eq('id', sceneId)

    if (updateError) {
      console.error('Failed to update scene', sceneId, updateError)
      return { error: 'Failed to update scene' }
    }
  } catch (error) {
    console.error('Image generation failed', error)
    return { error: 'Image generation failed' }
  }

  revalidatePath('/projects/[id]', 'page')
  return { success: true }
}

export async function generateVideoForScene(sceneId: string) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Unauthorized' }
  }

  const { data: scene, error: sceneError } = await supabase
    .from('scenes')
    .select('*')
    .eq('id', sceneId)
    .single()

  if (sceneError || !scene) {
    return { error: 'Scene not found' }
  }

  if (!scene.video_prompt || !scene.image_url) {
    return { error: 'Missing video prompt or image url' }
  }

  try {
    const comfyuiClient = new ComfyUiClient()
    await comfyuiClient.connect()
    const videoUrl = await comfyuiClient.generateVideo({ positive_prompt: scene.video_prompt })
    await comfyuiClient.disconnect()

    const { error: updateError } = await supabase
      .from('scenes')
      .update({ video_url: videoUrl })
      .eq('id', sceneId)

    if (updateError) {
      console.error('Failed to update scene', sceneId, updateError)
      return { error: 'Failed to update scene' }
    }
  } catch (error) {
    console.error('Video generation failed', error)
    return { error: 'Video generation failed' }
  }

  revalidatePath('/projects/[id]', 'page')
  return { success: true }
}

export async function markProjectAsComplete(projectId: string) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Unauthorized' }
  }

  try {
    await supabase
      .from('projects')
      .update({ status: 'completed' })
      .eq('id', projectId)
  } catch (error) {
    console.error('Failed to mark project as complete', error)
    return { error: 'Failed to mark project as complete' }
  }


  revalidatePath('/projects/[id]', 'page')
  return { success: true }
}



export async function updateSceneScript(sceneId: string, script: string, newImagePrompt: string, videoPrompt: string) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Unauthorized' }
  }

  const { error } = await supabase
    .from('scenes')
    .update({ script: script, image_prompt: newImagePrompt, video_prompt: videoPrompt })
    .eq('id', sceneId)

  if (error) {
    return { error: 'Failed to update scene' }
  }

  revalidatePath('/projects/[id]', 'page')
  return { success: true }
}

export async function deleteProject(projectId: string) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Unauthorized' }
  }

  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', projectId)
    .eq('user_id', user.id)

  if (error) {
    console.error('Failed to delete project', error)
    return { error: 'Failed to delete project' }
  }

  revalidatePath('/dashboard')
  return { success: true }
}

export async function uploadSceneImage(sceneId: string, formData: FormData) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Unauthorized' }
  }

  const file = formData.get('file') as File
  if (!file) {
    return { error: 'No file uploaded' }
  }

  const { data: scene, error: sceneError } = await supabase
    .from('scenes')
    .select('project_id')
    .eq('id', sceneId)
    .single()

  if (sceneError || !scene) {
    return { error: 'Scene not found' }
  }

  const fileName = `${scene.project_id}/${sceneId}-${Date.now()}.png`

  const { error: uploadError } = await supabase
    .storage
    .from('images')
    .upload(fileName, file, {
      contentType: file.type,
      upsert: true
    })

  if (uploadError) {
    console.error('Failed to upload image', uploadError)
    return { error: 'Failed to upload image: ' + uploadError.message }
  }

  const { data: { publicUrl } } = supabase
    .storage
    .from('images')
    .getPublicUrl(fileName)

  const { error: updateError } = await supabase
    .from('scenes')
    .update({ image_url: publicUrl, status: 'completed' })
    .eq('id', sceneId)

  if (updateError) {
    console.error('Failed to update scene', sceneId, updateError)
    return { error: 'Failed to update scene' }
  }

  revalidatePath('/projects/[id]', 'page')
  return { success: true, imageUrl: publicUrl }
}
