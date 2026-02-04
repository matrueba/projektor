import { getDatabase } from './db'
import { v4 as uuidv4 } from 'uuid'

// Types
export interface User {
    id: string
    email: string | null
    name: string | null
    createdAt: string
}

export interface Project {
    id: string
    userId: string
    name: string
    theme: string | null
    style: string | null
    constraints: string | null
    sceneCount: number
    maxDuration: number | null
    generationMode: string
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
    imageUrl: string | null
    videoUrl: string | null
    startAt: number | null
    endAt: number | null
    status: string
    createdAt: string
}

// User queries
export function getLocalUser(): User {
    const db = getDatabase()
    return db.prepare('SELECT * FROM users WHERE id = ?').get('local-user') as User
}

// Project queries
export function getProjectsByUserId(userId: string): Project[] {
    const db = getDatabase()
    return db.prepare('SELECT * FROM projects WHERE userId = ? ORDER BY createdAt DESC').all(userId) as Project[]
}

export function getProjectById(id: string): Project | undefined {
    const db = getDatabase()
    return db.prepare('SELECT * FROM projects WHERE id = ?').get(id) as Project | undefined
}

export function createProject(data: {
    userId: string
    name: string
    theme?: string
    style?: string
    constraints?: string
    sceneCount?: number
    maxDuration?: number
    generationMode?: string
    status?: string
}): Project {
    const db = getDatabase()
    const id = uuidv4()
    const now = new Date().toISOString()

    db.prepare(`
    INSERT INTO projects (id, userId, name, theme, style, constraints, sceneCount, maxDuration, generationMode, status, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
        id,
        data.userId,
        data.name,
        data.theme || null,
        data.style || null,
        data.constraints || null,
        data.sceneCount || 3,
        data.maxDuration || null,
        data.generationMode || 'batch',
        data.status || 'draft',
        now,
        now
    )

    return getProjectById(id)!
}

export function updateProject(id: string, data: Partial<Project>): void {
    const db = getDatabase()
    const updates: string[] = []
    const values: unknown[] = []

    if (data.status !== undefined) {
        updates.push('status = ?')
        values.push(data.status)
    }
    if (data.name !== undefined) {
        updates.push('name = ?')
        values.push(data.name)
    }

    if (updates.length > 0) {
        updates.push('updatedAt = ?')
        values.push(new Date().toISOString())
        values.push(id)

        db.prepare(`UPDATE projects SET ${updates.join(', ')} WHERE id = ?`).run(...values)
    }
}

export function deleteProject(id: string, userId: string): boolean {
    const db = getDatabase()
    const result = db.prepare('DELETE FROM projects WHERE id = ? AND userId = ?').run(id, userId)
    return result.changes > 0
}

// Scene queries
export function getScenesByProjectId(projectId: string): Scene[] {
    const db = getDatabase()
    return db.prepare('SELECT * FROM scenes WHERE projectId = ? ORDER BY "order" ASC').all(projectId) as Scene[]
}

export function getSceneById(id: string): Scene | undefined {
    const db = getDatabase()
    return db.prepare('SELECT * FROM scenes WHERE id = ?').get(id) as Scene | undefined
}

export function createScene(data: {
    projectId: string
    order: number
    script?: string
    imagePrompt?: string
    videoPrompt?: string
    startAt?: number
    endAt?: number
    status?: string
}): Scene {
    const db = getDatabase()
    const id = uuidv4()
    const now = new Date().toISOString()

    db.prepare(`
    INSERT INTO scenes (id, projectId, "order", script, imagePrompt, videoPrompt, startAt, endAt, status, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
        id,
        data.projectId,
        data.order,
        data.script || null,
        data.imagePrompt || null,
        data.videoPrompt || null,
        data.startAt || null,
        data.endAt || null,
        data.status || 'pending',
        now
    )

    return getSceneById(id)!
}

export function createScenes(scenes: Array<{
    projectId: string
    order: number
    script?: string
    imagePrompt?: string
    videoPrompt?: string
    startAt?: number
    endAt?: number
    status?: string
}>): void {
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
                scene.status || 'pending',
                now
            )
        }
    })

    insertMany(scenes)
}

export function updateScene(id: string, data: Partial<Scene>): void {
    const db = getDatabase()
    const updates: string[] = []
    const values: unknown[] = []

    const fields: (keyof Scene)[] = ['script', 'imagePrompt', 'videoPrompt', 'imageUrl', 'videoUrl', 'status']

    for (const field of fields) {
        if (data[field] !== undefined) {
            updates.push(`${field === 'order' ? '"order"' : field} = ?`)
            values.push(data[field])
        }
    }

    if (updates.length > 0) {
        values.push(id)
        db.prepare(`UPDATE scenes SET ${updates.join(', ')} WHERE id = ?`).run(...values)
    }
}

export function deleteScenesByProjectId(projectId: string): void {
    const db = getDatabase()
    db.prepare('DELETE FROM scenes WHERE projectId = ?').run(projectId)
}
