import { getDatabase } from "./db"
import { v4 as uuidv4 } from "uuid"
import { Project, Scene, Settings } from "@/types"


export async function getProjects(): Promise<Project[]> {
  const db = getDatabase()
  return db
    .prepare("SELECT * FROM projects ORDER BY createdAt DESC")
    .all() as Project[]
}

export async function getProjectById(id: string): Promise<Project | undefined> {
  const db = getDatabase()
  return db.prepare("SELECT * FROM projects WHERE id = ?").get(id) as
    | Project
    | undefined
}

export async function createProject(data: {
  name: string
  theme?: string
  style?: string
  constraints?: string
  sceneCount?: number
  maxDuration?: number
  generationMode?: string
  status?: string
}): Promise<Project> {
  const db = getDatabase()
  const id = uuidv4()
  const now = new Date().toISOString()

  db.prepare(
    `
    INSERT INTO projects (id, name, theme, style, constraints, sceneCount, maxDuration, generationMode, status, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `,
  ).run(
    id,
    data.name,
    data.theme || null,
    data.style || null,
    data.constraints || null,
    data.sceneCount || 3,
    data.maxDuration || null,
    data.generationMode || "sequential",
    data.status || "draft",
    now,
    now,
  )

  const project = await getProjectById(id)
  if (!project) throw new Error("Failed to create project")
  return project
}

export async function updateProject(
  id: string,
  data: Partial<Project>,
): Promise<void> {
  const db = getDatabase()
  const updates: string[] = []
  const values: unknown[] = []

  if (data.status !== undefined) {
    updates.push("status = ?")
    values.push(data.status)
  }
  if (data.name !== undefined) {
    updates.push("name = ?")
    values.push(data.name)
  }

  if (updates.length > 0) {
    updates.push("updatedAt = ?")
    values.push(new Date().toISOString())
    values.push(id)

    db.prepare(`UPDATE projects SET ${updates.join(", ")} WHERE id = ?`).run(
      ...values,
    )
  }
}

export async function deleteProject(id: string): Promise<boolean> {
  const db = getDatabase()
  const result = db.prepare("DELETE FROM projects WHERE id = ?").run(id)
  return result.changes > 0
}

export async function getScenesByProjectId(
  projectId: string,
): Promise<Scene[]> {
  const db = getDatabase()
  return db
    .prepare('SELECT * FROM scenes WHERE projectId = ? ORDER BY "order" ASC')
    .all(projectId) as Scene[]
}

export async function getSceneById(id: string): Promise<Scene | undefined> {
  const db = getDatabase()
  return db.prepare("SELECT * FROM scenes WHERE id = ?").get(id) as
    | Scene
    | undefined
}

export async function createScene(data: {
  projectId: string
  order: number
  script?: string
  imagePrompt?: string
  videoPrompt?: string
  startAt?: number
  endAt?: number
  status?: string
}): Promise<Scene> {
  const db = getDatabase()
  const id = uuidv4()
  const now = new Date().toISOString()

  db.prepare(
    `
    INSERT INTO scenes (id, projectId, "order", script, imagePrompt, videoPrompt, startAt, endAt, status, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `,
  ).run(
    id,
    data.projectId,
    data.order,
    data.script || null,
    data.imagePrompt || null,
    data.videoPrompt || null,
    data.startAt || null,
    data.endAt || null,
    data.status || "pending",
    now,
  )

  const scene = await getSceneById(id)
  if (!scene) throw new Error("Failed to create scene")
  return scene
}

export async function createScenes(
  scenes: Array<{
    projectId: string
    order: number
    script?: string
    imagePrompt?: string
    videoPrompt?: string
    startAt?: number
    endAt?: number
    status?: string
  }>,
): Promise<void> {
  const db = getDatabase()
  const now = new Date().toISOString()

  const insert = db.prepare(`
    INSERT INTO scenes (id, projectId, "order", script, imagePrompt, videoPrompt, startAt, endAt, status, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const insertMany = db.transaction((scenesData: typeof scenes) => {
    for (const scene of scenesData) {
      insert.run(
        uuidv4(),
        scene.projectId,
        scene.order,
        scene.script || null,
        scene.imagePrompt || null,
        scene.videoPrompt || null,
        scene.startAt || null,
        scene.endAt || null,
        scene.status || "pending",
        now,
      )
    }
  })

  insertMany(scenes)
}

export async function updateScene(
  id: string,
  data: Partial<Scene>,
): Promise<void> {
  const db = getDatabase()
  const updates: string[] = []
  const values: unknown[] = []

  const fields: (keyof Scene)[] = [
    "script",
    "imagePrompt",
    "videoPrompt",
    "imageUrl",
    "videoUrl",
    "status",
  ]

  for (const field of fields) {
    if (data[field] !== undefined) {
      updates.push(`${field === "order" ? '"order"' : field} = ?`)
      values.push(data[field])
    }
  }

  if (updates.length > 0) {
    values.push(id)
    db.prepare(`UPDATE scenes SET ${updates.join(", ")} WHERE id = ?`).run(
      ...values,
    )
  }
}

export async function deleteScenesByProjectId(
  projectId: string,
): Promise<void> {
  const db = getDatabase()
  db.prepare("DELETE FROM scenes WHERE projectId = ?").run(projectId)
}

export async function getSettings(): Promise<Settings> {
  const db = getDatabase()
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      id TEXT PRIMARY KEY DEFAULT 'default',
      isLocal INTEGER DEFAULT 0,
      localUrl TEXT DEFAULT 'http://localhost:11434',
      comfyUrl TEXT DEFAULT 'localhost:8188',
      model TEXT DEFAULT 'gemini-3-flash-preview',
      provider TEXT DEFAULT 'google',
      updatedAt TEXT DEFAULT (datetime('now'))
    )
  `)
  const row = db
    .prepare("SELECT * FROM settings WHERE id = ?")
    .get("default") as {
      id: string
      isLocal: number
      localUrl: string
      comfyUrl: string
      model: string
      provider: string
      apiKey: string | null
      updatedAt: string
    }
  return {
    ...row,
    isLocal: row.isLocal === 1,
  }
}

export async function updateSettings(
  data: Partial<Omit<Settings, "id" | "updatedAt">>,
): Promise<Settings> {
  const db = getDatabase()
  const updates: string[] = []
  const values: unknown[] = []

  if (data.isLocal !== undefined) {
    updates.push("isLocal = ?")
    values.push(data.isLocal ? 1 : 0)
  }
  if (data.localUrl !== undefined) {
    updates.push("localUrl = ?")
    values.push(data.localUrl)
  }
  if (data.comfyUrl !== undefined) {
    updates.push("comfyUrl = ?")
    values.push(data.comfyUrl)
  }
  if (data.model !== undefined) {
    updates.push("model = ?")
    values.push(data.model)
  }
  if (data.provider !== undefined) {
    updates.push("provider = ?")
    values.push(data.provider)
  }

  if (updates.length > 0) {
    updates.push("updatedAt = ?")
    values.push(new Date().toISOString())
    values.push("default")

    db.prepare(`UPDATE settings SET ${updates.join(", ")} WHERE id = ?`).run(
      ...values,
    )
  }

  return await getSettings()
}
