import Database from "better-sqlite3"
import path from "path"
import fs from "fs"
import { initializeSchema } from "./schema"

let db: Database.Database | null = null

/**
 * Returns a singleton instance of the SQLite database connection.
 * Creates the database file and initializes schema if it doesn't exist.
 */
export function getDatabase(): Database.Database {
  if (!db) {
    const dbPath =
      process.env.DATABASE_PATH ||
      path.join(process.cwd(), "data", "projektor.db")
    fs.mkdirSync(path.dirname(dbPath), { recursive: true })
    db = new Database(dbPath)
    initializeSchema(db)
  }
  return db
}

/**
 * Closes the database connection if open.
 */
export function closeDatabase(): void {
  if (db) {
    db.close()
    db = null
  }
}
