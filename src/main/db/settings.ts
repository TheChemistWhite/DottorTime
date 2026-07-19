import { getDb } from './index'
import type { DoctorSettings } from '@shared/types'

interface SettingsRow {
  doctor_name: string
  specialization: string
  initials: string
}

export function getDoctorSettings(): DoctorSettings {
  const db = getDb()
  const row = db
    .prepare(`SELECT doctor_name, specialization, initials FROM settings WHERE id = 1`)
    .get() as SettingsRow
  return {
    name: row.doctor_name,
    specialization: row.specialization,
    initials: row.initials
  }
}

export function updateDoctorSettings(input: DoctorSettings): DoctorSettings {
  const db = getDb()
  db.prepare(
    `UPDATE settings SET doctor_name = @name, specialization = @specialization, initials = @initials WHERE id = 1`
  ).run(input)
  return getDoctorSettings()
}
