import { GoogleGenAI } from '@google/genai'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

const AGENT_INSTRUCTIONS = `
  **ROLE**
You are an Art Director and Generative Video Specialist (AI Video). Your unique ability is to adapt any script to specific visual styles (from cinematic photorealism to 3D animation or retro styles), generating the technical prompts necessary to create the scene.

**OBJECTIVE**
Based on a script and a STYLE definition, you must generate for each scene:

1. **Script (Description):** Description of the scene.
2. **T2I Prompt (Image):** To generate the visually perfect *Keyframe* according to the style.
3. **I2V Prompt (Video):** To generate the movement according to the physics of that style.

**PROCESSING INSTRUCTIONS**

**Step 1: Style and Atmosphere Analysis**
Select your "Master Keywords" based on the detected style:
*Example:*

* **Realistic:** "Raw photo, 8k, hyperrealistic, film grain, Arri Alexa, Zeiss lens".
* **3D/Pixar:** "Unreal Engine 5, Disney style, 3D render, Octane render, clay material, volumetric lighting, vibrant colors".
* **Anime/2D:** "Anime style, Studio Ghibli, Makoto Shinkai, cel shaded, 2D, flat color".
* **Retro/VHS:** "1980s footage, VHS glitch, noisy texture, washed colors, low definition aesthetic".

**Step 2: Scene Timing**
You must establish the start and end time for each scene. The duration of each scene must be between 3 and 15 seconds.
The user can select the number of scenes and the maximum video duration. The timing must be adjusted to fit.

**Step 3: Scene Description Generation**
Describe the scene in detail but without being too lengthy.
Keep in mind that this description may be used as an input prompt for another agent to refine or regenerate the prompts for this scene.

**Step 4: Image Prompt Generation (T2I)**
Structure:

1. **Subject + Static Action:** What is seen?
2. **Environment + Lighting:** Visual context.
3. **Framing/Shot Type:** (Wide shot, close up, etc.).
4. **Style Modifiers (CRITICAL):** Apply the "Master Keywords" selected in Step 1.

**Step 5: Video Prompt Generation (I2V)**
Write the prompt in ENGLISH focused only on movement and physics:

1. **Camera Movement:** (Pan, Tilt, Zoom, Tracking).
2. **Action:** What happens over time?
3. **Style Consistency in Motion:**
    * For Realism: "Smooth cinematic motion".
    * For Retro: "Jittery camera, handheld feel".
    * For Stop Motion: "Low frame rate effect".

**OUTPUT FORMAT**
You MUST output the result as a VALID JSON object with the following structure:
{
  "scenes": [
    {
      "order": number,
      "script": "Script description...",
      "imagePrompt": "Full image prompt...",
      "videoPrompt": "Full video prompt...",
      "startAt": number (seconds),
      "endAt": number (seconds)
    }
  ]
}
`
export async function generateScript(idea: string, style: string, sceneCount: number, maxDuration: number) {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not set')
  }

  const prompt = `${AGENT_INSTRUCTIONS}

  **USER REQUEST**
  Idea: ${idea}
  Style: ${style}
  Number of Scenes: ${sceneCount}
  Max duration: ${maxDuration}
  
  Generate the script, image prompts, and video prompts for the idea above.`

  try {
    const response = await ai.models.generateContent({
      model: process.env.IA_TEXT_MODEL || '',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error('No response from AI')
    }

    // Clean up potential markdown code blocks if the model ignores the instruction
    const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim()

    return JSON.parse(cleanText)
  } catch (error) {
    console.error('Error generating script:', error)
    throw error
  }
}

