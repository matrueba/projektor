'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { generateScript } from '@/services/ai-agents'
import { CreateProjectInput } from '@/types'
import { Scene } from '@/types'
import { ComfyUiClient } from '@/services/comfyui-client'
import {
  getCurrentUser,
  createProject as dbCreateProject,
  updateProject,
  deleteProject as dbDeleteProject,
  getScenesByProjectId,
  getSceneById,
  createScenes,
  updateScene,
} from '@/lib/db'
import {
  uploadFile,
  getFileUrl,
  deleteProjectFiles,
} from '@/lib/storage'

export async function createProject(data: CreateProjectInput) {
  const user = getCurrentUser()

  // 1. Create Project Record
  const project = dbCreateProject({
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

  console.log('Created project:', project.id)

  // 2. Trigger AI Generation
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

    createScenes(scenesToInsert)

  } catch (err) {
    console.error('AI Generation failed', err)
    updateProject(project.id, { status: 'failed' })
    return { error: 'AI Generation failed' }
  }

  revalidatePath('/dashboard')
  redirect(`/projects/${project.id}`)
}

export async function deleteAccount() {
  // In local mode, this doesn't make sense
  // Just return success
  return { success: true }
}

export async function signOutAction() {
  // In local mode, just redirect to dashboard
  redirect('/dashboard')
}

export async function generateImagesForProject(projectId: string) {
  const user = getCurrentUser()
  if (!user) {
    return { error: 'Unauthorized' }
  }

  const scenes = getScenesByProjectId(projectId)

  if (!scenes || scenes.length === 0) {
    return { error: 'No scenes to generate images for' }
  }

  try {
    for (const scene of scenes) {
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

      const uploadResult = await uploadFile(fileName, imageBuffer, 'image/png')

      if (!uploadResult.success) {
        console.error('Failed to upload image', uploadResult.error)
        continue
      }

      updateScene(scene.id, { imageUrl: fileName, status: 'completed' })
    }

    updateProject(projectId, { status: 'image' })
  } catch (error) {
    console.error('Image generation failed', error)
    updateProject(projectId, { status: 'failed' })
    return { error: 'Image generation failed' }
  }

  revalidatePath('/projects/[id]', 'page')
  return { success: true }
}

export async function generateVideosForProject(projectId: string) {
  const user = getCurrentUser()
  if (!user) {
    return { error: 'Unauthorized' }
  }

  const scenes = getScenesByProjectId(projectId)

  if (!scenes || scenes.length === 0) {
    return { error: 'No scenes to generate videos for' }
  }

  try {
    for (const scene of scenes) {
      if (!scene.videoPrompt || !scene.imageUrl) {
        continue
      }

      const comfyuiClient = new ComfyUiClient()
      await comfyuiClient.connect()
      const videos = await comfyuiClient.generateVideo({ positivePrompt: scene.videoPrompt, imageUrl: scene.imageUrl })
      await comfyuiClient.disconnect()

      if (!videos || videos.length === 0) {
        console.error('No videos generated for scene', scene.id)
        continue
      }

      const videoBuffer = videos[0]
      const fileName = `${projectId}/${scene.id}-${Date.now()}.mp4`

      const uploadResult = await uploadFile(fileName, videoBuffer, 'video/mp4')

      if (!uploadResult.success) {
        console.error('Failed to upload video', uploadResult.error)
        continue
      }

      updateScene(scene.id, { videoUrl: fileName, status: 'completed' })
    }

    updateProject(projectId, { status: 'video' })
  } catch (error) {
    console.error('Video generation failed', error)
    updateProject(projectId, { status: 'failed' })
    return { error: 'Video generation failed' }
  }

  revalidatePath('/projects/[id]', 'page')
  return { success: true }
}

export async function generateImageForScene(sceneId: string, referenceImage?: string) {
  const user = getCurrentUser()
  if (!user) {
    return { error: 'Unauthorized' }
  }

  const scene = getSceneById(sceneId)

  if (!scene) {
    return { error: 'Scene not found' }
  }

  if (!scene.imagePrompt) {
    return { error: 'No image prompt for scene' }
  }

  try {
    const comfyuiClient = new ComfyUiClient()
    await comfyuiClient.connect()
    let images: ArrayBuffer[] = []
    if (referenceImage) {
      console.log('Reference image provided:', referenceImage)
      images = await comfyuiClient.generateImage2Image({ positivePrompt: scene.imagePrompt, referenceImage })
    } else {
      images = await comfyuiClient.generateImage({ positivePrompt: scene.imagePrompt })
    }

    await comfyuiClient.disconnect()

    if (!images || images.length === 0) {
      return { error: 'No images generated' }
    }

    const imageBuffer = images[0]
    const fileName = `${scene.projectId}/${scene.id}-${Date.now()}.png`

    const uploadResult = await uploadFile(fileName, imageBuffer, 'image/png')

    if (!uploadResult.success) {
      console.error('Failed to upload image', uploadResult.error)
      return { error: 'Failed to upload image' }
    }

    updateScene(sceneId, { imageUrl: fileName })
  } catch (error) {
    console.error('Image generation failed', error)
    return { error: 'Image generation failed' }
  }

  revalidatePath('/projects/[id]', 'page')
  return { success: true }
}

export async function generateVideoForScene(sceneId: string, imagePath: string) {
  const user = getCurrentUser()
  if (!user) {
    return { error: 'Unauthorized' }
  }

  const scene = getSceneById(sceneId)

  if (!scene) {
    return { error: 'Scene not found' }
  }

  if (!scene.videoPrompt || !scene.imageUrl) {
    return { error: 'Missing video prompt or image url' }
  }

  try {
    const comfyuiClient = new ComfyUiClient()
    await comfyuiClient.connect()
    const videos = await comfyuiClient.generateVideo({ positivePrompt: scene.videoPrompt, imageUrl: imagePath })
    await comfyuiClient.disconnect()

    if (!videos || videos.length === 0) {
      return { error: 'No videos generated' }
    }

    const videoBuffer = videos[0]
    const fileName = `${scene.projectId}/${scene.id}-${Date.now()}.mp4`

    const uploadResult = await uploadFile(fileName, videoBuffer, 'video/mp4')

    if (!uploadResult.success) {
      console.error('Failed to upload video', uploadResult.error)
      return { error: 'Failed to upload video' }
    }

    updateScene(sceneId, { videoUrl: fileName })
  } catch (error) {
    console.error('Video generation failed', error)
    return { error: 'Video generation failed' }
  }

  revalidatePath('/projects/[id]', 'page')
  return { success: true }
}

export async function markProjectAsComplete(projectId: string) {
  const user = getCurrentUser()
  if (!user) {
    return { error: 'Unauthorized' }
  }

  try {
    updateProject(projectId, { status: 'completed' })
  } catch (error) {
    console.error('Failed to mark project as complete', error)
    return { error: 'Failed to mark project as complete' }
  }

  revalidatePath('/projects/[id]', 'page')
  return { success: true }
}

export async function updateSceneScript(sceneId: string, script: string, newImagePrompt: string, videoPrompt: string) {
  const user = getCurrentUser()
  if (!user) {
    return { error: 'Unauthorized' }
  }

  try {
    updateScene(sceneId, { script, imagePrompt: newImagePrompt, videoPrompt })
  } catch (error) {
    console.error('Failed to update scene', error)
    return { error: 'Failed to update scene' }
  }

  revalidatePath('/projects/[id]', 'page')
  return { success: true }
}

export async function deleteProject(projectId: string) {
  const user = getCurrentUser()
  if (!user) {
    return { error: 'Unauthorized' }
  }

  const result = dbDeleteProject(projectId, user.id)

  if (!result) {
    return { error: 'Failed to delete project' }
  }

  // Delete associated files
  deleteProjectFiles(projectId)

  revalidatePath('/dashboard')
  return { success: true }
}

export async function uploadSceneImage(sceneId: string, formData: FormData) {
  const user = getCurrentUser()
  if (!user) {
    return { error: 'Unauthorized' }
  }

  const file = formData.get('file') as File
  if (!file) {
    return { error: 'No file uploaded' }
  }

  const scene = getSceneById(sceneId)

  if (!scene) {
    return { error: 'Scene not found' }
  }

  const fileName = `${scene.projectId}/${sceneId}-${Date.now()}.png`
  const arrayBuffer = await file.arrayBuffer()

  const uploadResult = await uploadFile(fileName, arrayBuffer, file.type)

  if (!uploadResult.success) {
    console.error('Failed to upload image', uploadResult.error)
    return { error: 'Failed to upload image: ' + uploadResult.error }
  }

  updateScene(sceneId, { imageUrl: fileName, status: 'completed' })

  revalidatePath('/projects/[id]', 'page')
  return { success: true, imageUrl: fileName }
}

export async function getSignedUrl(path: string, options?: { download?: boolean }): Promise<{ success: boolean; signedUrl?: string; error?: string }> {
  // In local mode, return the local API URL
  const url = getFileUrl(path)
  return { success: true, signedUrl: url }
}
