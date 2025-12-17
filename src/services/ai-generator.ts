import { delay } from '@/lib/utils'
import { generateScript } from './ai-agents'

export interface GeneratedScript {
  scenes: {
    order: number
    text: string
    imagePrompt: string
    videoPrompt: string
    startAt: number
    endsAt: number
  }[]
}

// Mock AI Service
export const AiService = {
  // Step 1: Generate Script from Idea
  generateScript: async (idea: string, sceneCount: number = 3): Promise<GeneratedScript> => {
    await delay(2000) // Simulate API latency

    // Mock logic to generate simple scenes
    const scenes = Array.from({ length: sceneCount }).map((_, i) => ({
      order: i + 1,
      text: `Voiceover for scene ${i + 1}: Based on the idea "${idea.substring(0, 20)}..."`,
      imagePrompt: `Image shot for scene ${i + 1}, style consistent with request.`,
      videoPrompt: `Cinematic shot for scene ${i + 1}, style consistent with request.`,
      startAt: 0,
      endsAt: 10
    }))

    return { scenes }
  },

  // Step 2: Generate Image from Prompt
  generateImage: async (prompt: string): Promise<string> => {
    await delay(2000)
    // Return a placeholder image
    return 'https://picsum.photos/seed/picsum/200/300'
  },

  // Step 3: Generate Video from Image
  generateVideo: async (imageUrl: string, prompt: string): Promise<string> => {
    await delay(2500)
    // Return a dummy video link (in real app, this would be a cloud storage URL)
    return 'https://www.w3schools.com/html/mov_bbb.mp4'
  }
}
