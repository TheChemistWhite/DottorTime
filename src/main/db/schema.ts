// Schema SQLite e migrazioni. Ogni migrazione è idempotente (IF NOT EXISTS)
// e viene applicata in ordine in base a PRAGMA user_version.

import type Database from 'better-sqlite3'

interface Migration {
  version: number
  run: (db: Database.Database) => void
}

const migrations: Migration[] = [
  {
    version: 1,
    run: (db) => {
      db.exec(`
        CREATE TABLE IF NOT EXISTS patients (
          id TEXT PRIMARY KEY,
          first_name TEXT NOT NULL,
          last_name TEXT NOT NULL,
          dob TEXT,
          phone TEXT,
          email TEXT,
          address TEXT,
          diagnosis TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS visits (
          id TEXT PRIMARY KEY,
          patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
          date TEXT NOT NULL,
          time TEXT NOT NULL,
          reason TEXT NOT NULL,
          acuity_od TEXT,
          acuity_os TEXT,
          iop_od TEXT,
          iop_os TEXT,
          notes TEXT,
          created_at TEXT NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_visits_patient ON visits(patient_id);
        CREATE INDEX IF NOT EXISTS idx_visits_date ON visits(date);
        CREATE INDEX IF NOT EXISTS idx_patients_last_name ON patients(last_name);

        CREATE TABLE IF NOT EXISTS settings (
          id INTEGER PRIMARY KEY CHECK (id = 1),
          doctor_name TEXT NOT NULL,
          specialization TEXT NOT NULL,
          initials TEXT NOT NULL
        );
      `)
      // Nessun dato del medico precaricato: la tabella settings resta vuota
      // finché l'utente non completa il wizard di primo avvio (vedi renderer,
      // componente OnboardingModal).
    }
  },
  {
    version: 2,
    run: (db) => {
      // Svuota completamente il database. Questa migrazione gira una volta
      // sola per ogni installazione (tracciata da PRAGMA user_version), quindi
      // non tocca i dati che l'utente inserirà dopo. Serve a ripulire i DB già
      // esistenti (creati durante lo sviluppo/test) da pazienti/visite di
      // prova e dal medico precompilato "Dr. Giuseppe Francione", così anche
      // le installazioni pre-esistenti ripartono dal wizard di primo avvio.
      db.exec(`
        DELETE FROM visits;
        DELETE FROM patients;
        DELETE FROM settings;
      `)
    }
  }
]

export function runMigrations(db: Database.Database): void {
  db.pragma('foreign_keys = ON')
  const current = db.pragma('user_version', { simple: true }) as number

  const pending = migrations
    .filter((m) => m.version > current)
    .sort((a, b) => a.version - b.version)

  const applyAll = db.transaction(() => {
    for (const migration of pending) {
      migration.run(db)
      db.pragma(`user_version = ${migration.version}`)
    }
  })

  if (pending.length > 0) applyAll()
}
