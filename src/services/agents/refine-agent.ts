"use server"

import { Agent } from "@mastra/core/agent"
import { createOllama } from "ai-sdk-ollama"
import { z } from "zod"
import { getSettings } from "@/lib/db"
import { SCRIPT_AGENT_REFINE_INSTRUCTIONS } from "./instructions/refine-instructions"

/**
 * Zod schema for refined scene output.
 */
const RefineScenesResponseSchema = z.object({
  script: z.string().describe("Script description for the scene"),
  imagePrompt: z
    .string()
    .describe("Full image prompt for generating the scene image"),
  videoPrompt: z
    .string()
    .describe("Full video prompt for generating the scene video"),
})

/**
 * Zod schema for storyboard context.
 */
const StoryboardSchema = z.object({
  theme: z.string().describe("Theme of the storyboard"),
  style: z.string().describe("Style of the storyboard"),
  constraints: z.string().describe("Constraints of the storyboard"),
})

export type RefineScenesResponse = z.infer<typeof RefineScenesResponseSchema>
export type StoryboardSchema = z.infer<typeof StoryboardSchema>

/**
 * AI agent that refines scene prompts based on user feedback.
 * Takes the original storyboard context and current scene, applies user-requested changes.
 * Supports both local (Ollama) and remote (OpenAI, etc.) models.
 * @param originalStoryboard - Project context (theme, style, constraints)
 * @param currentScene - Current scene prompts to refine
 * @param changeRequest - User's natural language instructions for refinement
 * @returns Refined scene with updated prompts
 */
export const refineAgent = async (
  originalStoryboard: StoryboardSchema,
  currentScene: RefineScenesResponse,
  changeRequest: string,
): Promise<RefineScenesResponse> => {
  try {
    const settings = await getSettings()
    const config = {
      provider: settings.provider,
      model: settings.model,
      apiKey: process.env.API_KEY,
      localUrl: settings.localUrl,
      isLocal: settings.isLocal,
    }

    if (!config.isLocal && !config.apiKey) throw "API key not configured"

    let model: any
    if (config.isLocal) {
      const ollamaInstance = createOllama({ baseURL: config.localUrl })
      model = ollamaInstance(config.model)
    } else {
      model = {
        id: `${config.provider}/${config.model}` as `${string}/${string}`,
        apiKey: config.apiKey,
        provider: config.provider,
      }
    }

    const agent = new Agent({
      id: "refiner",
      name: "Refine Agent",
      instructions: SCRIPT_AGENT_REFINE_INSTRUCTIONS,
      model: model,
    })

    const prompt = `
                    **USER REQUEST**
                    ORIGINAL STORYBOARD: ${originalStoryboard}
                    CURRENT SCENE: ${currentScene}
                    CHANGE REQUEST: ${changeRequest}
`

    const input = {
      role: "user" as const,
      content: prompt,
    }

    const result = await agent.generate([input], {
      structuredOutput: {
        schema: RefineScenesResponseSchema,
      },
    })

    return result.object as RefineScenesResponse
  } catch (error: any) {
    if (error.message.includes("not found")) {
      throw new Error("Model not found, check your settings and try again")
    }
    throw error
  }
}
