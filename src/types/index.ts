export interface Project {
  id: string
  name: string
  theme: string | null
  style: string | null
  constraints: string | null
  sceneCount: number
  maxDuration: number | null
  generationMode: "sequential"
  status: string
  createdAt: string
  updatedAt: string
}

export interface Scene {
  id: string
  projectId: string
  order: number
  script: string | null
  imagePrompt: string | null
  videoPrompt: string | null
  imageUrl?: string | null
  videoUrl?: string | null
  status: string
  startAt: number | null
  endAt: number | null
  createdAt: string | Date
}

export interface Settings {
  id: string
  isLocal: boolean
  localUrl: string
  comfyUrl: string
  model: string
  provider: string
  apiKey: string | null
  updatedAt: string
}

export type CreateProjectInput = {
  name: string
  theme: string
  style: string
  constraints: string
  sceneCount: number
  maxDuration: number
  generationMode: "sequential"
}
