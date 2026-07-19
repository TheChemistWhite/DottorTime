import { app } from 'electron'
import { join } from 'path'
import { existsSync, mkdirSync } from 'fs'
import Database from 'better-sqlite3'
import { runMigrations } from './schema'

let dbInstance: Database.Database | null = null

// Il database vive nella cartella dati utente del sistema operativo,
// non nella cartella di installazione — così sopravvive agli aggiornamenti
// dell'app e resta privato all'utente del sistema operativo corrente.
export function getDbPath(): string {
  const userData = app.getPath('userData')
  if (!existsSync(userData)) mkdirSync(userData, { recursive: true })
  return join(userData, 'dottortime.db')
}

export function getDb(): Database.Database {
  if (dbInstance) return dbInstance

  const dbPath = getDbPath()
  dbInstance = new Database(dbPath)
  dbInstance.pragma('journal_mode = WAL')
  runMigrations(dbInstance)

  return dbInstance
}

export function closeDb(): void {
  if (dbInstance) {
    dbInstance.close()
    dbInstance = null
  }
}
