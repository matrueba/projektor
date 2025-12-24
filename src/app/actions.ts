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
import fs from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'

const STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET_NAME || 'projektor_images'

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
      userId: user.id,
      name: data.name,
      theme: data.theme,
      style: data.style,
      constraints: data.constraints,
      maxDuration: data.maxDuration,
      generationMode: data.generationMode,
      sceneCount: data.sceneCount,
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
      projectId: project.id,
      order: scene.order,
      script: scene.script,
      imagePrompt: scene.imagePrompt,
      videoPrompt: scene.videoPrompt,
      startAt: scene.startAt,
      endAt: scene.endAt,
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
    .eq('projectId', projectId)

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
      const images = await comfyuiClient.generateImage({ positivePrompt: scene.imagePrompt })
      await comfyuiClient.disconnect()

      if (!images || images.length === 0) {
        console.error('No images generated for scene', scene.id)
        continue
      }

      const imageBuffer = images[0]
      const fileName = `${projectId}/${scene.id}-${Date.now()}.png`

      const { error: uploadError } = await adminSupabase
        .storage
        .from(STORAGE_BUCKET)
        .upload(fileName, imageBuffer, {
          contentType: 'image/png',
          upsert: true
        })

      if (uploadError) {
        console.error('Failed to upload image', uploadError)
        continue
      }

      const imageUrl = fileName
      const { error: updateError } = await supabase
        .from('scenes')
        .update({ imageUrl: imageUrl, status: 'completed' })
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
    .eq('projectId', projectId)

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
      const videoUrl = await comfyuiClient.generateVideo({ positivePrompt: scene.videoPrompt, imageUrl: scene.imageUrl })
      await comfyuiClient.disconnect()

      const { error: updateError } = await supabase
        .from('scenes')
        .update({ videoUrl: videoUrl, status: 'completed' })
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

  if (!scene.imagePrompt) {
    return { error: 'No image prompt for scene' }
  }

  try {
    const adminSupabase = createAdminClient()
    const channel = adminSupabase.channel(`scene-${sceneId}`)
    channel.subscribe()

    const onProgress = async (value: number, max: number) => {
      await channel.send({
        type: 'broadcast',
        event: 'progress',
        payload: { value, max }
      })
    }

    const comfyuiClient = new ComfyUiClient()
    await comfyuiClient.connect()
    let images: ArrayBuffer[] = []
    if (referenceImage) {
      console.log('Reference image provided:', referenceImage)
      images = await comfyuiClient.generateImage2Image({ positivePrompt: scene.imagePrompt, referenceImage }, onProgress)
    } else {
      images = await comfyuiClient.generateImage({ positivePrompt: scene.imagePrompt }, onProgress)
    }

    await comfyuiClient.disconnect()
    await adminSupabase.removeChannel(channel)

    if (!images || images.length === 0) {
      return { error: 'No images generated' }
    }
    const imageBuffer = images[0]
    const fileName = `${scene.projectId}/${scene.id}-${Date.now()}.png`
    const { error: uploadError } = await adminSupabase
      .storage
      .from(STORAGE_BUCKET)
      .upload(fileName, imageBuffer, {
        contentType: 'image/png',
        upsert: true
      })

    if (uploadError) {
      console.error('Failed to upload image', uploadError)
      return { error: 'Failed to upload image' }
    }

    const { error: updateError } = await supabase
      .from('scenes')
      .update({ imageUrl: fileName })
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


export async function generateVideoForScene(sceneId: string, imagePath: string) {
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

  if (!scene.videoPrompt || !scene.imageUrl) {
    return { error: 'Missing video prompt or image url' }
  }

  try {
    const adminSupabase = createAdminClient()
    const channel = adminSupabase.channel(`scene-${sceneId}`)
    channel.subscribe()

    const onProgress = async (value: number, max: number) => {
      await channel.send({
        type: 'broadcast',
        event: 'progress',
        payload: { value, max }
      })
    }

    const comfyuiClient = new ComfyUiClient()
    await comfyuiClient.connect()
    const videos = await comfyuiClient.generateVideo({ positivePrompt: scene.videoPrompt, imageUrl: imagePath }, onProgress)
    await comfyuiClient.disconnect()


    if (!videos || videos.length === 0) {
      return { error: 'No videos generated' }
    }
    const videoBuffer = videos[0]
    const fileName = `${scene.projectId}/${scene.id}-${Date.now()}.mp4`
    const { error: uploadError } = await adminSupabase
      .storage
      .from(STORAGE_BUCKET)
      .upload(fileName, videoBuffer, {
        contentType: 'video/mp4',
        upsert: true
      })

    if (uploadError) {
      console.error('Failed to upload video', uploadError)
      return { error: 'Failed to upload video' }
    }

    const { error: updateError } = await supabase
      .from('scenes')
      .update({ videoUrl: fileName })
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
    .update({ script: script, imagePrompt: newImagePrompt, videoPrompt: videoPrompt })
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
    .eq('userId', user.id)

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
    .select('projectId')
    .eq('id', sceneId)
    .single()

  if (sceneError || !scene) {
    return { error: 'Scene not found' }
  }

  const fileName = `${scene.projectId}/${sceneId}-${Date.now()}.png`

  const adminSupabase = createAdminClient()
  const { error: uploadError } = await adminSupabase
    .storage
    .from(STORAGE_BUCKET)
    .upload(fileName, file, {
      contentType: file.type,
      upsert: true
    })

  if (uploadError) {
    console.error('Failed to upload image', uploadError)
    return { error: 'Failed to upload image: ' + uploadError.message }
  }

  // Store path instead of public URL
  const { error: updateError } = await supabase
    .from('scenes')
    .update({ imageUrl: fileName, status: 'completed' })
    .eq('id', sceneId)

  if (updateError) {
    console.error('Failed to update scene', sceneId, updateError)
    return { error: 'Failed to update scene' }
  }

  revalidatePath('/projects/[id]', 'page')
  return { success: true, imageUrl: fileName }
}


export async function getSignedUrl(path: string, options?: { download?: boolean }) {
  const adminSupabase = createAdminClient()

  try {
    const { data, error } = await adminSupabase
      .storage
      .from(STORAGE_BUCKET)
      .createSignedUrl(path, 60 * 60, { // 1 hour expiry
        download: options?.download ? true : undefined
      })

    if (error) {
      console.error('[getSignedUrl] Failed to create signed URL', error)
      return { error: 'Failed to create signed URL' }
    }
    return { success: true, signedUrl: data.signedUrl }
  } catch (error) {
    console.error('[getSignedUrl] Error creating signed URL', error)
    return { error: 'Error creating signed URL' }
  }
}
