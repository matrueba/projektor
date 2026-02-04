import fs from 'fs'
import path from 'path'

// Storage directory - uses local folder in project root
const STORAGE_PATH = process.env.STORAGE_PATH || path.join(process.cwd(), 'storage')

/**
 * Ensure the storage directory exists
 */
function ensureStorageDir(subPath?: string): string {
    const fullPath = subPath ? path.join(STORAGE_PATH, subPath) : STORAGE_PATH
    if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true })
    }
    return fullPath
}

/**
 * Upload a file to local storage
 * @param fileName - The file path relative to storage (e.g., "projectId/sceneId-timestamp.png")
 * @param data - The file data as Buffer or ArrayBuffer
 * @param contentType - The MIME type (for reference, not used in local storage)
 */
export async function uploadFile(
    fileName: string,
    data: Buffer | ArrayBuffer,
    contentType?: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const dirPath = path.dirname(fileName)
        ensureStorageDir(dirPath)

        const fullPath = path.join(STORAGE_PATH, fileName)
        const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data)

        fs.writeFileSync(fullPath, buffer)

        return { success: true }
    } catch (error) {
        console.error('Failed to upload file:', error)
        return { success: false, error: (error as Error).message }
    }
}

/**
 * Get the absolute path to a stored file
 */
export function getFilePath(fileName: string): string {
    return path.join(STORAGE_PATH, fileName)
}

/**
 * Get the URL path for serving static files (for Next.js public folder or API route)
 * Returns a path that can be used in the frontend
 */
export function getFileUrl(fileName: string): string {
    // For local storage, we'll use an API route to serve files
    return `/api/storage/${fileName}`
}

/**
 * Check if a file exists in storage
 */
export function fileExists(fileName: string): boolean {
    const fullPath = path.join(STORAGE_PATH, fileName)
    return fs.existsSync(fullPath)
}

/**
 * Read a file from storage
 */
export function readFile(fileName: string): Buffer | null {
    try {
        const fullPath = path.join(STORAGE_PATH, fileName)
        if (!fs.existsSync(fullPath)) {
            return null
        }
        return fs.readFileSync(fullPath)
    } catch (error) {
        console.error('Failed to read file:', error)
        return null
    }
}

/**
 * Delete a file from storage
 */
export function deleteFile(fileName: string): boolean {
    try {
        const fullPath = path.join(STORAGE_PATH, fileName)
        if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath)
        }
        return true
    } catch (error) {
        console.error('Failed to delete file:', error)
        return false
    }
}

/**
 * Delete all files for a project
 */
export function deleteProjectFiles(projectId: string): boolean {
    try {
        const projectPath = path.join(STORAGE_PATH, projectId)
        if (fs.existsSync(projectPath)) {
            fs.rmSync(projectPath, { recursive: true, force: true })
        }
        return true
    } catch (error) {
        console.error('Failed to delete project files:', error)
        return false
    }
}

/**
 * Get the MIME type based on file extension
 */
export function getMimeType(fileName: string): string {
    const ext = path.extname(fileName).toLowerCase()
    const mimeTypes: Record<string, string> = {
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.webp': 'image/webp',
        '.mp4': 'video/mp4',
        '.webm': 'video/webm',
        '.mov': 'video/quicktime',
    }
    return mimeTypes[ext] || 'application/octet-stream'
}
