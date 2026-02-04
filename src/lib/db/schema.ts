import Database from 'better-sqlite3'

export function initializeSchema(db: Database.Database): void {
    // Users table for local auth
    db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE,
      name TEXT,
      createdAt TEXT DEFAULT (datetime('now'))
    )
  `)

    // Projects table
    db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      name TEXT NOT NULL,
      theme TEXT,
      style TEXT,
      constraints TEXT,
      sceneCount INTEGER DEFAULT 3,
      maxDuration INTEGER,
      generationMode TEXT DEFAULT 'batch',
      status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'script', 'image', 'video', 'completed', 'failed')),
      createdAt TEXT DEFAULT (datetime('now')),
      updatedAt TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
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

    // Create indexes
    db.exec(`
    CREATE INDEX IF NOT EXISTS idx_projects_userId ON projects(userId);
    CREATE INDEX IF NOT EXISTS idx_scenes_projectId ON scenes(projectId);
  `)

    // Create default local user if not exists
    const defaultUser = db.prepare('SELECT id FROM users WHERE id = ?').get('local-user')
    if (!defaultUser) {
        db.prepare('INSERT INTO users (id, email, name) VALUES (?, ?, ?)').run(
            'local-user',
            'local@projektor.local',
            'Local User'
        )
    }
}
