import { randomUUID } from 'crypto'
import { getDb } from './index'
import type {
  CalendarDay,
  CalendarMonth,
  DashboardStats,
  UpcomingAppointment,
  Visit,
  VisitInput
} from '@shared/types'

interface VisitRow {
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
}

function mapVisit(row: VisitRow): Visit {
  return {
    id: row.id,
    patientId: row.patient_id,
    date: row.date,
    time: row.time,
    reason: row.reason,
    acuityOD: row.acuity_od,
    acuityOS: row.acuity_os,
    iopOD: row.iop_od,
    iopOS: row.iop_os,
    notes: row.notes,
    createdAt: row.created_at
  }
}

export function createVisit(input: VisitInput): Visit {
  const db = getDb()
  const id = randomUUID()
  const now = new Date().toISOString()

  db.prepare(
    `INSERT INTO visits (id, patient_id, date, time, reason, acuity_od, acuity_os, iop_od, iop_os, notes, created_at)
     VALUES (@id, @patientId, @date, @time, @reason, @acuityOD, @acuityOS, @iopOD, @iopOS, @notes, @createdAt)`
  ).run({
    id,
    patientId: input.patientId,
    date: input.date,
    time: input.time,
    reason: input.reason.trim(),
    acuityOD: input.acuityOD ?? null,
    acuityOS: input.acuityOS ?? null,
    iopOD: input.iopOD ?? null,
    iopOS: input.iopOS ?? null,
    notes: input.notes ?? null,
    createdAt: now
  })

  db.prepare(`UPDATE patients SET updated_at = ? WHERE id = ?`).run(now, input.patientId)

  const row = db.prepare(`SELECT * FROM visits WHERE id = ?`).get(id) as VisitRow
  return mapVisit(row)
}

export function updateVisit(id: string, input: VisitInput): Visit | null {
  const db = getDb()
  const existing = db.prepare(`SELECT * FROM visits WHERE id = ?`).get(id) as VisitRow | undefined
  if (!existing) return null

  db.prepare(
    `UPDATE visits SET patient_id = @patientId, date = @date, time = @time, reason = @reason,
       acuity_od = @acuityOD, acuity_os = @acuityOS, iop_od = @iopOD, iop_os = @iopOS, notes = @notes
     WHERE id = @id`
  ).run({
    id,
    patientId: input.patientId,
    date: input.date,
    time: input.time,
    reason: input.reason.trim(),
    acuityOD: input.acuityOD ?? null,
    acuityOS: input.acuityOS ?? null,
    iopOD: input.iopOD ?? null,
    iopOS: input.iopOS ?? null,
    notes: input.notes ?? null
  })

  const now = new Date().toISOString()
  db.prepare(`UPDATE patients SET updated_at = ? WHERE id = ?`).run(now, input.patientId)

  const row = db.prepare(`SELECT * FROM visits WHERE id = ?`).get(id) as VisitRow
  return mapVisit(row)
}

const todayIso = (): string => new Date().toISOString().slice(0, 10)
const nowHm = (): string => new Date().toTimeString().slice(0, 5)

export function getDashboardStats(): DashboardStats {
  const db = getDb()
  const today = todayIso()
  const now = nowHm()

  const visiteOggi = (
    db.prepare(`SELECT COUNT(*) as c FROM visits WHERE date = ?`).get(today) as { c: number }
  ).c

  const pazientiTotali = (
    db.prepare(`SELECT COUNT(*) as c FROM patients`).get() as { c: number }
  ).c

  const prossimo = db
    .prepare(
      `SELECT v.time as time, p.first_name as first_name, p.last_name as last_name
       FROM visits v JOIN patients p ON p.id = v.patient_id
       WHERE v.date > ? OR (v.date = ? AND v.time >= ?)
       ORDER BY v.date ASC, v.time ASC
       LIMIT 1`
    )
    .get(today, today, now) as
    | { time: string; first_name: string; last_name: string }
    | undefined

  const noteInAttesa = (
    db
      .prepare(
        `SELECT COUNT(*) as c FROM visits
         WHERE date <= ? AND (notes IS NULL OR trim(notes) = '')`
      )
      .get(today) as { c: number }
  ).c

  return {
    visiteOggi,
    pazientiTotali,
    prossimoOra: prossimo ? prossimo.time : null,
    prossimoPaziente: prossimo ? `${prossimo.first_name} ${prossimo.last_name}` : null,
    noteInAttesa
  }
}

export function getUpcomingAppointments(limit = 6): UpcomingAppointment[] {
  const db = getDb()
  const today = todayIso()
  const now = nowHm()

  const rows = db
    .prepare(
      `SELECT v.id as visit_id, v.patient_id as patient_id, p.first_name as first_name,
              p.last_name as last_name, v.date as date, v.time as time, v.reason as reason
       FROM visits v JOIN patients p ON p.id = v.patient_id
       WHERE v.date > ? OR (v.date = ? AND v.time >= ?)
       ORDER BY v.date ASC, v.time ASC
       LIMIT ?`
    )
    .all(today, today, now, limit) as Array<{
    visit_id: string
    patient_id: string
    first_name: string
    last_name: string
    date: string
    time: string
    reason: string
  }>

  return rows.map((r) => ({
    visitId: r.visit_id,
    patientId: r.patient_id,
    patientName: `${r.first_name} ${r.last_name}`,
    date: r.date,
    time: r.time,
    reason: r.reason
  }))
}

// Tutti gli appuntamenti/visite di un giorno specifico (passato, oggi o
// futuro), usato quando il medico clicca un giorno nel calendario.
export function getAppointmentsForDay(dateIso: string): UpcomingAppointment[] {
  const db = getDb()

  const rows = db
    .prepare(
      `SELECT v.id as visit_id, v.patient_id as patient_id, p.first_name as first_name,
              p.last_name as last_name, v.date as date, v.time as time, v.reason as reason
       FROM visits v JOIN patients p ON p.id = v.patient_id
       WHERE v.date = ?
       ORDER BY v.time ASC`
    )
    .all(dateIso) as Array<{
    visit_id: string
    patient_id: string
    first_name: string
    last_name: string
    date: string
    time: string
    reason: string
  }>

  return rows.map((r) => ({
    visitId: r.visit_id,
    patientId: r.patient_id,
    patientName: `${r.first_name} ${r.last_name}`,
    date: r.date,
    time: r.time,
    reason: r.reason
  }))
}

const WEEKDAY_LABELS_IT = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom']
const MONTH_LABELS_IT = [
  'Gennaio',
  'Febbraio',
  'Marzo',
  'Aprile',
  'Maggio',
  'Giugno',
  'Luglio',
  'Agosto',
  'Settembre',
  'Ottobre',
  'Novembre',
  'Dicembre'
]

// year: 4 cifre, month: 1-12
export function getCalendarMonth(year: number, month: number): CalendarMonth {
  const db = getDb()
  const first = new Date(Date.UTC(year, month - 1, 1))
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate()
  // getUTCDay(): 0=domenica..6=sabato -> convertiamo a 0=lunedì..6=domenica
  const firstWeekday = (first.getUTCDay() + 6) % 7

  const monthStart = `${year}-${String(month).padStart(2, '0')}-01`
  const monthEnd = `${year}-${String(month).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`

  const apptRows = db
    .prepare(`SELECT DISTINCT date FROM visits WHERE date BETWEEN ? AND ?`)
    .all(monthStart, monthEnd) as Array<{ date: string }>
  const apptDates = new Set(apptRows.map((r) => r.date))

  const days: CalendarDay[] = []
  for (let i = 0; i < firstWeekday; i++) {
    days.push({ date: '', num: 0, hasAppt: false })
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const iso = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    days.push({ date: iso, num: d, hasAppt: apptDates.has(iso) })
  }

  return {
    label: `${MONTH_LABELS_IT[month - 1]} ${year}`,
    weekdayLabels: WEEKDAY_LABELS_IT,
    days,
    todayIso: todayIso()
  }
}
