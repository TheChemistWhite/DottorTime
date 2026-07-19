import { randomUUID } from 'crypto'
import { getDb } from './index'
import type { Patient, PatientInput, PatientSummary, Visit } from '@shared/types'

interface PatientRow {
  id: string
  first_name: string
  last_name: string
  dob: string | null
  phone: string | null
  email: string | null
  address: string | null
  diagnosis: string | null
  created_at: string
  updated_at: string
}

function mapPatient(row: PatientRow): Patient {
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    dob: row.dob,
    phone: row.phone,
    email: row.email,
    address: row.address,
    diagnosis: row.diagnosis,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

export function initials(firstName: string, lastName: string): string {
  const a = firstName.trim().charAt(0).toUpperCase()
  const b = lastName.trim().charAt(0).toUpperCase()
  return `${a}${b}` || '?'
}

export function listPatients(query?: string): Patient[] {
  const db = getDb()
  if (query && query.trim()) {
    const q = `%${query.trim().toLowerCase()}%`
    const rows = db
      .prepare(
        `SELECT * FROM patients
         WHERE lower(first_name || ' ' || last_name) LIKE ?
         ORDER BY last_name, first_name`
      )
      .all(q) as PatientRow[]
    return rows.map(mapPatient)
  }
  const rows = db.prepare(`SELECT * FROM patients ORDER BY updated_at DESC`).all() as PatientRow[]
  return rows.map(mapPatient)
}

export function listPatientSummaries(query?: string): PatientSummary[] {
  return listPatients(query).map((p) => ({
    id: p.id,
    name: `${p.firstName} ${p.lastName}`,
    initials: initials(p.firstName, p.lastName)
  }))
}

export function getPatient(id: string): Patient | null {
  const db = getDb()
  const row = db.prepare(`SELECT * FROM patients WHERE id = ?`).get(id) as PatientRow | undefined
  return row ? mapPatient(row) : null
}

export function getPatientVisits(patientId: string): Visit[] {
  const db = getDb()
  const rows = db
    .prepare(`SELECT * FROM visits WHERE patient_id = ? ORDER BY date DESC, time DESC`)
    .all(patientId) as Array<{
    id: string
    patient_id: string
    date: string
    time: string
    reason: string
    acuity_od: string | null
    acuity_os: string | null
    iop_od: string | null
    iop_os: string | null
    notes: string | null
    created_at: string
  }>
  return rows.map((r) => ({
    id: r.id,
    patientId: r.patient_id,
    date: r.date,
    time: r.time,
    reason: r.reason,
    acuityOD: r.acuity_od,
    acuityOS: r.acuity_os,
    iopOD: r.iop_od,
    iopOS: r.iop_os,
    notes: r.notes,
    createdAt: r.created_at
  }))
}

export function createPatient(input: PatientInput): Patient {
  const db = getDb()
  const now = new Date().toISOString()
  const id = randomUUID()

  db.prepare(
    `INSERT INTO patients (id, first_name, last_name, dob, phone, email, address, diagnosis, created_at, updated_at)
     VALUES (@id, @firstName, @lastName, @dob, @phone, @email, @address, @diagnosis, @createdAt, @updatedAt)`
  ).run({
    id,
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    dob: input.dob ?? null,
    phone: input.phone ?? null,
    email: input.email ?? null,
    address: input.address ?? null,
    diagnosis: input.diagnosis ?? null,
    createdAt: now,
    updatedAt: now
  })

  return getPatient(id) as Patient
}

export function updatePatient(id: string, input: Partial<PatientInput>): Patient | null {
  const db = getDb()
  const existing = getPatient(id)
  if (!existing) return null

  const merged = { ...existing, ...input, updatedAt: new Date().toISOString() }

  db.prepare(
    `UPDATE patients SET first_name = @firstName, last_name = @lastName, dob = @dob,
       phone = @phone, email = @email, address = @address, diagnosis = @diagnosis,
       updated_at = @updatedAt
     WHERE id = @id`
  ).run({
    id,
    firstName: merged.firstName,
    lastName: merged.lastName,
    dob: merged.dob ?? null,
    phone: merged.phone ?? null,
    email: merged.email ?? null,
    address: merged.address ?? null,
    diagnosis: merged.diagnosis ?? null,
    updatedAt: merged.updatedAt
  })

  return getPatient(id)
}

export function countPatients(): number {
  const db = getDb()
  const row = db.prepare(`SELECT COUNT(*) as c FROM patients`).get() as { c: number }
  return row.c
}
