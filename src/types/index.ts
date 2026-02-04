export interface User {
  id: string
  name?: string | null
  email?: string | null
  image?: string | null
}

export interface Project {
  id: string
  userId: string
  name: string
  theme: string | null
  style: string | null
  constraints?: string | null
  sceneCount: number
  maxDuration?: number | null
  generationMode?: string
  status: string
  createdAt: string | Date
  updatedAt?: string | Date
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
  createdAt?: string | Date
}

export type CreateProjectInput = {
  name: string
  theme: string
  style: string
  constraints: string
  sceneCount: number
  maxDuration: number
  generationMode: 'batch' | 'sequential'
}
