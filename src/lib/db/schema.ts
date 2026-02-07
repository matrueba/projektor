import Database from "better-sqlite3"

/**
 * Initializes the SQLite database schema for the application.
 * Creates tables for projects, scenes, and settings if they don't exist.
 * Also creates indexes for performance and inserts default settings.
 * @param {Database.Database} db - Better-sqlite3 database instance
 * @returns {void}
 */
export function initializeSchema(db: Database.Database): void {


  // Projects table
  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      theme TEXT,
      style TEXT,
      constraints TEXT,
      sceneCount INTEGER DEFAULT 3,
      maxDuration INTEGER,
      generationMode TEXT DEFAULT 'sequential',
      status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'script', 'image', 'video', 'completed', 'failed')),
      createdAt TEXT DEFAULT (datetime('now')),
      updatedAt TEXT DEFAULT (datetime('now'))
    )
  `)

  // Scenes table
  db.exec(`
    CREATE TABLE IF NOT EXISTS scenes (
      id TEXT PRIMARY KEY,
      projectId TEXT NOT NULL,
      "order" INTEGER NOT NULL,
      script TEXT,
      imagePrompt TEXT,
      videoPrompt TEXT,
      imageUrl TEXT,
      videoUrl TEXT,
      startAt INTEGER,
      endAt INTEGER,
      status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
      createdAt TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE
    )
  `)

  // Settings table for app configuration
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

  // Create indexes
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_scenes_projectId ON scenes(projectId);
  `)

  // Create default settings if not exists
  const defaultSettings = db
    .prepare("SELECT id FROM settings WHERE id = ?")
    .get("default")
  if (!defaultSettings) {
    db.prepare("INSERT INTO settings (id) VALUES (?)").run("default")
  }
}
