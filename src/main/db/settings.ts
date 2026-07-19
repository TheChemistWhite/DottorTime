import { getDb } from './index'
import type { DoctorSettings } from '@shared/types'

interface SettingsRow {
  doctor_name: string
  specialization: string
  initials: string
}

// Ritorna null finché il medico non ha completato il wizard di primo avvio
// (nessuna riga in tabella settings): il renderer usa questo per decidere se
// mostrare l'onboarding invece della normale interfaccia.
export function getDoctorSettings(): DoctorSettings | null {
  const db = getDb()
  const row = db
    .prepare(`SELECT doctor_name, specialization, initials FROM settings WHERE id = 1`)
    .get() as SettingsRow | undefined
  if (!row) return null
  return {
    name: row.doctor_name,
    specialization: row.specialization,
    initials: row.initials
  }
}

// Upsert: crea la riga al primo salvataggio (onboarding), la aggiorna nelle
// volte successive (pannello Impostazioni).
export function updateDoctorSettings(input: DoctorSettings): DoctorSettings {
  const db = getDb()
  db.prepare(
    `INSERT INTO settings (id, doctor_name, specialization, initials)
     VALUES (1, @name, @specialization, @initials)
     ON CONFLICT(id) DO UPDATE SET
       doctor_name = excluded.doctor_name,
       specialization = excluded.specialization,
       initials = excluded.initials`
  ).run(input)
  return getDoctorSettings() as DoctorSettings
}

// Svuota completamente il database (pazienti, visite, dati medico): usata dal
// pulsante "Cancella tutti i dati" in Impostazioni. Dopo la chiamata l'app
// torna nello stato di primo avvio (onboarding).
export function resetAllData(): void {
  const db = getDb()
  const run = db.transaction(() => {
    db.prepare(`DELETE FROM visits`).run()
    db.prepare(`DELETE FROM patients`).run()
    db.prepare(`DELETE FROM settings`).run()
  })
  run()
}
