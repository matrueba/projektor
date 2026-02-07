"use server"

import { Agent } from "@mastra/core/agent"
import { createOllama } from "ai-sdk-ollama"
import { z } from "zod"
import { SCRIPT_AGENT_INSTRUCTIONS } from "./instructions/script-instructions"
import { getSettings } from "@/lib/db"

/**
 * Zod schema for a single scene in the script.
 */
const SceneSchema = z.object({
  order: z.number().describe("Scene order/position in the video"),
  script: z.string().describe("Script description for the scene"),
  imagePrompt: z
    .string()
    .describe("Full image prompt for generating the scene image"),
  videoPrompt: z
    .string()
    .describe("Full video prompt for generating the scene video"),
  startAt: z.number().describe("Start time in seconds"),
  endAt: z.number().describe("End time in seconds"),
})

/**
 * Zod schema for the complete scenes response from the AI agent.
 */
const ScenesResponseSchema = z.object({
  scenes: z.array(SceneSchema).describe("Array of scenes for the video"),
})

export type ScriptScene = z.infer<typeof SceneSchema>
export type ScenesResponse = z.infer<typeof ScenesResponseSchema>

/**
 * AI agent that generates video scripts with scene descriptions and prompts.
 * Creates structured output with T2I and I2V prompts for each scene.
 * Supports both local (Ollama) and remote (OpenAI, etc.) models.
 * @param idea - Main theme/concept for the video
 * @param style - Visual style (cinematic, animated, etc.)
 * @param sceneCount - Number of scenes to generate
 * @param maxDuration - Maximum video duration in seconds
 * @returns Structured scenes response with prompts and timing
 */
export const scriptAgent = async (
  idea: string,
  style: string,
  sceneCount: number,
  maxDuration: number,
): Promise<ScenesResponse> => {
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
      id: "scripter",
      name: "Script Agent",
      instructions: SCRIPT_AGENT_INSTRUCTIONS,
      model: model,
    })

    const prompt = `
                    **USER REQUEST**
                    Idea: ${idea}
                    Style: ${style}
                    Number of Scenes: ${sceneCount}
                    Max duration: ${maxDuration}

  Generate the script, image prompts, and video prompts for the idea above.`

    const input = {
      role: "user" as const,
      content: prompt,
    }

    const result = await agent.generate([input], {
      structuredOutput: {
        schema: ScenesResponseSchema,
      },
    })

    return result.object as ScenesResponse
  } catch (error: any) {
    if (error.message.includes("not found")) {
      throw new Error("Model not found, check your settings and try again")
    }
    throw error
  }
}
