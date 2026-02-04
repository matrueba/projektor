import Database from 'better-sqlite3'
import path from 'path'
import { initializeSchema } from './schema'

// Database file path - uses local file in project root
const DB_PATH = process.env.DATABASE_PATH || path.join(process.cwd(), 'projektor.db')

// Singleton database instance
let db: Database.Database | null = null

export function getDatabase(): Database.Database {
    if (!db) {
        db = new Database(DB_PATH)
        db.pragma('journal_mode = WAL')
        db.pragma('foreign_keys = ON')
        initializeSchema(db)
    }
    return db
}

export function closeDatabase(): void {
    if (db) {
        db.close()
        db = null
    }
}
