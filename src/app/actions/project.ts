"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { scriptAgent, ScriptScene } from "@/services/agents/script-agent"
import { CreateProjectInput } from "@/types"
import { createScenes, getProjectById } from "@/lib/db"
import { updateProject } from "@/lib/db"
import { createProject as dbCreateProject } from "@/lib/db"
import {
  deleteProject as dbDeleteProject,
  getSceneById,
  updateScene,
} from "@/lib/db"
import { saveFile, deleteProjectFiles } from "@/lib/storage"
import { refineAgent } from "@/services/agents/refine-agent"

/**
 * Refines a scene's prompts using AI based on user instructions.
 * Allows iterative improvement of prompts with natural language feedback.
 * @param sceneId - Unique scene ID to refine
 * @param userRequest - Natural language instructions for refinement
 * @returns Object with success or error
 */
export async function refineScene(sceneId: string, userRequest: string) {
  const scene = await getSceneById(sceneId)
  if (!scene) {
    return { error: "Scene not found" }
  }
  const project = await getProjectById(scene.projectId)
  if (!project) {
    return { error: "Project not found" }
  }
  const storyboard = {
    theme: project.theme || "",
    style: project.style || "",
    constraints: project.constraints || "",
  }
  const sceneToRefine = {
    script: scene.script || "",
    imagePrompt: scene.imagePrompt || "",
    videoPrompt: scene.videoPrompt || "",
  }
  const refinedScene = await refineAgent(storyboard, sceneToRefine, userRequest)
  await updateScene(sceneId, refinedScene)
  revalidatePath("/projects/[id]", "page")
  return { success: true }
}

/**
 * Creates a new video project with AI-generated scenes.
 * Uses the script agent to automatically generate prompts for each scene.
 * Redirects to the project page on completion.
 * @param data - Project creation input data
 * @returns Never returns (redirects) or returns error
 */
export async function createProject(data: CreateProjectInput) {
  const project = await dbCreateProject({
    userId: "local-user",
    name: data.name,
    theme: data.theme,
    style: data.style,
    constraints: data.constraints,
    maxDuration: data.maxDuration,
    generationMode: data.generationMode,
    sceneCount: data.sceneCount,
    status: "script",
  })

  try {
    const script = await scriptAgent(
      data.theme,
      data.style,
      data.sceneCount,
      data.maxDuration,
    )
    const scenesToInsert = script.scenes.map((scene: ScriptScene) => ({
      projectId: project.id,
      order: scene.order,
      script: scene.script,
      imagePrompt: scene.imagePrompt,
      videoPrompt: scene.videoPrompt,
      startAt: scene.startAt,
      endAt: scene.endAt,
      status: "pending",
    }))

    await createScenes(scenesToInsert)
  } catch (err) {
    await updateProject(project.id, { status: "failed" })
    return { error: "AI Generation failed" }
  }

  revalidatePath("/dashboard")
  redirect(`/projects/${project.id}`)
}

/**
 * Manually updates a scene's script and prompts.
 * Allows direct content editing without using AI.
 * @param sceneId - Unique scene ID
 * @param script - New script description
 * @param newImagePrompt - New T2I prompt
 * @param videoPrompt - New I2V prompt
 * @returns Object with success or error
 */
export async function updateSceneScript(
  sceneId: string,
  script: string,
  newImagePrompt: string,
  videoPrompt: string,
) {
  try {
    await updateScene(sceneId, {
      script,
      imagePrompt: newImagePrompt,
      videoPrompt,
    })
  } catch (error) {
    return { error: "Failed to update scene" }
  }

  revalidatePath("/projects/[id]", "page")
  return { success: true }
}

/**
 * Deletes a project and all its associated files.
 * Removes the database record and cleans up storage.
 * @param projectId - Unique project ID to delete
 * @returns Object with success or error
 */
export async function deleteProject(projectId: string) {
  const result = await dbDeleteProject(projectId)

  if (!result) {
    return { error: "Failed to delete project" }
  }

  deleteProjectFiles(projectId)
  revalidatePath("/dashboard")
  return { success: true }
}

/**
 * Uploads a custom image for a scene.
 * Allows using own images instead of AI-generated ones.
 * @param sceneId - Unique scene ID
 * @param formData - FormData containing the file to upload
 * @returns Object with success, error and/or imageUrl
 */
export async function uploadSceneImage(sceneId: string, formData: FormData) {
  const file = formData.get("file") as File
  if (!file) {
    return { error: "No file uploaded" }
  }

  const scene = await getSceneById(sceneId)
  if (!scene) {
    return { error: "Scene not found" }
  }

  const fileName = `${scene.projectId}/images/${sceneId}-${Date.now()}.png`
  const arrayBuffer = await file.arrayBuffer()
  const uploadResult = await saveFile(fileName, arrayBuffer)

  if (!uploadResult.success) {
    return { error: "Failed to upload image: " + uploadResult.error }
  }

  await updateScene(sceneId, { imageUrl: fileName, status: "completed" })

  revalidatePath("/projects/[id]", "page")
  return { success: true, imageUrl: fileName }
}
