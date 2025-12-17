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
  theme: string
  style: string
  constraints?: string
  sceneCount: number
  status: 'draft' | 'processing' | 'completed' | 'failed'
  createdAt: Date
}

export interface Scene {
  id: string
  projectId: string
  order: number
  script: string
  imagePrompt: string
  videoPrompt: string
  imageUrl?: string
  videoUrl?: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  startAt: number
  endAt: number
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
