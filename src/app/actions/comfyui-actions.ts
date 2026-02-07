'use server'

import { revalidatePath } from "next/cache"
import { ComfyUiClient } from "@/services/comfyui-client"
import {
  updateProject,
  getScenesByProjectId,
  getSceneById,
  updateScene,
  getSettings,
} from "@/lib/db"
import { saveFile } from "@/lib/storage"
import { progressStore } from "@/lib/progress-store"

/**
 * Checks if the ComfyUI server is accessible and responding.
 * Called before starting any generation to ensure the backend is available.
 * @returns Success status object
 * @throws Error if connection to ComfyUI fails
 */
export const checkComfyUIConnection = async () => {
  try {
    const settings = await getSettings()
    const response = await fetch(`http://${settings.comfyUrl}`)
    if (!response.ok) {
      throw new Error("Failed to connect to ComfyUI")
    }
    return { success: true }
  } catch (error) {
    throw "Failed to connect to ComfyUI: " + error
  }
}

/**
 * Generates an image for a specific scene using ComfyUI.
 * Supports text-to-image (T2I) or image-to-image (I2I) generation if a reference image is provided.
 * Emits real-time progress via progressStore to update the UI.
 * @param sceneId - Unique scene ID
 * @param referenceImage - Optional reference image path for I2I generation
 * @returns Object with success or error
 */
export async function generateImageForScene(
  sceneId: string,
  referenceImage?: string,
) {
  let images: ArrayBuffer[] = []
  const scene = await getSceneById(sceneId)

  if (!scene) {
    return { error: "Scene not found" }
  }

  if (!scene.imagePrompt) {
    return { error: "No image prompt for scene" }
  }

  try {
    const comfyuiClient = new ComfyUiClient()
    await comfyuiClient.init()
    await comfyuiClient.connect()

    const onProgress = (value: number, max: number) => {
      progressStore.emit(sceneId, value, max)
    }

    if (referenceImage) {
      images = await comfyuiClient.generateImage2Image(
        { positivePrompt: scene.imagePrompt, referenceImage },
        onProgress,
      )
    } else {
      images = await comfyuiClient.generateImage(
        { positivePrompt: scene.imagePrompt },
        onProgress,
      )
    }
    await comfyuiClient.disconnect()
    if (!images || images.length === 0) {
      return { error: "No images generated" }
    }

    const imageBuffer = images[0]
    const fileName = `${scene.projectId}/images/${scene.id}-${Date.now()}.png`
    const uploadResult = await saveFile(fileName, imageBuffer)
    if (!uploadResult.success) {
      return { error: "Failed to upload image: " + uploadResult.error }
    }

    await updateScene(sceneId, { imageUrl: fileName })
  } catch (error) {
    return { error: "Image generation failed: " + error }
  }

  revalidatePath("/projects/[id]", "page")
  return { success: true }
}

/**
 * Generates a video for a specific scene using ComfyUI (image-to-video).
 * Takes an existing image and animates it.
 * Requires the scene to have imageUrl and videoPrompt defined.
 * @param sceneId - Unique scene ID
 * @param imagePath - Source image path for generation
 * @param length - Video duration in frames (16 FPS)
 * @returns Object with success or error
 */
export async function generateVideoForScene(
  sceneId: string,
  imagePath: string,
  length: number,
) {
  const scene = await getSceneById(sceneId)

  if (!scene) {
    return { error: "Scene not found" }
  }

  if (!scene.videoPrompt || !scene.imageUrl) {
    return { error: "Missing video prompt or image url" }
  }

  try {
    const comfyuiClient = new ComfyUiClient()
    await comfyuiClient.init()
    await comfyuiClient.connect()

    const onProgress = (value: number, max: number) => {
      progressStore.emit(sceneId, value, max)
    }

    const videos = await comfyuiClient.generateVideo(
      {
        positivePrompt: scene.videoPrompt,
        imagePath: imagePath,
        length: length,
      },
      onProgress,
    )
    await comfyuiClient.disconnect()

    if (!videos || videos.length === 0) {
      return { error: "No videos generated" }
    }

    const videoBuffer = videos[0]
    const fileName = `${scene.projectId}/videos/${scene.id}-${Date.now()}.mp4`

    const uploadResult = await saveFile(fileName, videoBuffer)

    if (!uploadResult.success) {
      return { error: "Failed to upload video: " + uploadResult.error }
    }

    await updateScene(sceneId, { videoUrl: fileName })
  } catch (error) {
    return { error: "Video generation failed: " + error }
  }

  revalidatePath("/projects/[id]", "page")
  return { success: true }
}

/**
 * Bulk generates images for all scenes in a project.
 * Processes each scene sequentially and updates project status to "image" on completion.
 * @param projectId - Unique project ID
 * @returns Object with success or error
 */
export async function bulkImagesGeneration(projectId: string) {
  const scenes = await getScenesByProjectId(projectId)

  if (!scenes || scenes.length === 0) {
    return { error: "No scenes to generate images for" }
  }

  try {
    for (const scene of scenes) {
      if (!scene.imagePrompt) {
        continue
      }

      const comfyuiClient = new ComfyUiClient()
      await comfyuiClient.init()
      await comfyuiClient.connect()

      const onProgress = (value: number, max: number) => {
        progressStore.emit(scene.id, value, max)
      }

      const images = await comfyuiClient.generateImage(
        { positivePrompt: scene.imagePrompt },
        onProgress,
      )
      await comfyuiClient.disconnect()

      if (!images || images.length === 0) {
        return { error: "No images generated for scene: " + scene.id }
      }

      const imageBuffer = images[0]
      const fileName = `${projectId}/images/${scene.id}-${Date.now()}.png`

      const uploadResult = await saveFile(fileName, imageBuffer)

      if (!uploadResult.success) {
        return { error: "Failed to upload image: " + uploadResult.error }
      }

      await updateScene(scene.id, { imageUrl: fileName, status: "completed" })
    }

    await updateProject(projectId, { status: "image" })
  } catch (error) {
    await updateProject(projectId, { status: "failed" })
    return { error: "Image generation failed: " + error }
  }

  revalidatePath("/projects/[id]", "page")
  return { success: true }
}

/**
 * Bulk generates videos for all scenes in a project.
 * Requires all scenes to have previously generated images.
 * Updates project status to "video" on completion.
 * @param projectId - Unique project ID
 * @returns Object with success or error
 */
export async function bulkVideosGeneration(projectId: string) {
  const scenes = await getScenesByProjectId(projectId)

  if (!scenes || scenes.length === 0) {
    return { error: "No scenes to generate videos for" }
  }

  try {
    for (const scene of scenes) {
      if (!scene.videoPrompt || !scene.imageUrl) {
        continue
      }

      const comfyuiClient = new ComfyUiClient()
      await comfyuiClient.init()
      await comfyuiClient.connect()

      const onProgress = (value: number, max: number) => {
        progressStore.emit(scene.id, value, max)
      }

      const videos = await comfyuiClient.generateVideo(
        { positivePrompt: scene.videoPrompt, imagePath: scene.imageUrl },
        onProgress,
      )
      await comfyuiClient.disconnect()

      if (!videos || videos.length === 0) {
        return { error: "No videos generated for scene: " + scene.id }
      }

      const videoBuffer = videos[0]
      const fileName = `${projectId}/videos/${scene.id}-${Date.now()}.mp4`

      const uploadResult = await saveFile(fileName, videoBuffer)

      if (!uploadResult.success) {
        return { error: "Failed to upload video: " + uploadResult.error }
      }

      await updateScene(scene.id, { videoUrl: fileName, status: "completed" })
    }

    await updateProject(projectId, { status: "video" })
  } catch (error) {
    await updateProject(projectId, { status: "failed" })
    return { error: "Video generation failed: " + error }
  }

  revalidatePath("/projects/[id]", "page")
  return { success: true }
}
