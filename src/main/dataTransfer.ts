import { app, dialog, BrowserWindow } from 'electron'
import { readFileSync, writeFileSync } from 'fs'
import { getDb } from './db'
import { getDoctorSettings, updateDoctorSettings } from './db/settings'
import type { ExportPayload, ExportResult, ImportMode, ImportResult, Patient, Visit } from '@shared/types'
import { DATA_SCHEMA_VERSION } from '@shared/types'

function currentWindow(): BrowserWindow | undefined {
  return BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0]
}

function defaultFileName(): string {
  const d = new Date()
  const stamp = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`
  return `dottortime-export-${stamp}.dottortime`
}

export async function exportData(): Promise<ExportResult> {
  const win = currentWindow()
  const { canceled, filePath } = await dialog.showSaveDialog(win as BrowserWindow, {
    title: 'Esporta dati DottorTime',
    defaultPath: defaultFileName(),
    filters: [
      { name: 'File DottorTime', extensions: ['dottortime'] },
      { name: 'JSON', extensions: ['json'] }
    ]
  })

  if (canceled || !filePath) {
    return { ok: false, canceled: true }
  }

  try {
    const db = getDb()
    const patients = db.prepare(`SELECT * FROM patients`).all() as Array<Record<string, unknown>>
    const visits = db.prepare(`SELECT * FROM visits`).all() as Array<Record<string, unknown>>

    const payload: ExportPayload = {
      schemaVersion: DATA_SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
      appVersion: app.getVersion(),
      doctor: getDoctorSettings(),
      patients: patients.map(rowToPatient),
      visits: visits.map(rowToVisit)
    }

    writeFileSync(filePath, JSON.stringify(payload, null, 2), 'utf-8')
    return { ok: true, filePath }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) }
  }
}

export async function importData(mode: ImportMode): Promise<ImportResult> {
  const win = currentWindow()
  const { canceled, filePaths } = await dialog.showOpenDialog(win as BrowserWindow, {
    title: 'Importa dati DottorTime',
    properties: ['openFile'],
    filters: [
      { name: 'File DottorTime', extensions: ['dottortime', 'json'] }
    ]
  })

  if (canceled || filePaths.length === 0) {
    return { ok: false, patientsImported: 0, visitsImported: 0, error: 'Operazione annullata' }
  }

  try {
    const raw = readFileSync(filePaths[0], 'utf-8')
    const payload = JSON.parse(raw) as ExportPayload

    if (!payload || typeof payload.schemaVersion !== 'number') {
      return {
        ok: false,
        patientsImported: 0,
        visitsImported: 0,
        error: 'File non valido: formato non riconosciuto.'
      }
    }
    if (payload.schemaVersion > DATA_SCHEMA_VERSION) {
      return {
        ok: false,
        patientsImported: 0,
        visitsImported: 0,
        error:
          'Questo file è stato esportato da una versione più recente di DottorTime. Aggiorna l\'app per importarlo.'
      }
    }

    const db = getDb()

    const run = db.transaction(() => {
      if (mode === 'replace') {
        db.prepare(`DELETE FROM visits`).run()
        db.prepare(`DELETE FROM patients`).run()
      }

      const insertPatient = db.prepare(
        `INSERT INTO patients (id, first_name, last_name, dob, phone, email, address, diagnosis, created_at, updated_at)
         VALUES (@id, @firstName, @lastName, @dob, @phone, @email, @address, @diagnosis, @createdAt, @updatedAt)
         ON CONFLICT(id) DO UPDATE SET
           first_name=excluded.first_name, last_name=excluded.last_name, dob=excluded.dob,
           phone=excluded.phone, email=excluded.email, address=excluded.address,
           diagnosis=excluded.diagnosis, updated_at=excluded.updated_at`
      )
      for (const p of payload.patients) {
        insertPatient.run(p)
      }

      const insertVisit = db.prepare(
        `INSERT INTO visits (id, patient_id, date, time, reason, acuity_od, acuity_os, iop_od, iop_os, notes, created_at)
         VALUES (@id, @patientId, @date, @time, @reason, @acuityOD, @acuityOS, @iopOD, @iopOS, @notes, @createdAt)
         ON CONFLICT(id) DO UPDATE SET
           patient_id=excluded.patient_id, date=excluded.date, time=excluded.time, reason=excluded.reason,
           acuity_od=excluded.acuity_od, acuity_os=excluded.acuity_os, iop_od=excluded.iop_od,
           iop_os=excluded.iop_os, notes=excluded.notes`
      )
      for (const v of payload.visits) {
        insertVisit.run(v)
      }

      if (payload.doctor) updateDoctorSettings(payload.doctor)
    })

    run()

    return {
      ok: true,
      patientsImported: payload.patients.length,
      visitsImported: payload.visits.length
    }
  } catch (err) {
    return {
      ok: false,
      patientsImported: 0,
      visitsImported: 0,
      error: err instanceof Error ? err.message : String(err)
    }
  }
}

function rowToPatient(row: Record<string, unknown>): Patient {
  return {
    id: row.id as string,
    firstName: row.first_name as string,
    lastName: row.last_name as string,
    dob: (row.dob as string) ?? null,
    phone: (row.phone as string) ?? null,
    email: (row.email as string) ?? null,
    address: (row.address as string) ?? null,
    diagnosis: (row.diagnosis as string) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string
  }
}

function rowToVisit(row: Record<string, unknown>): Visit {
  return {
    id: row.id as string,
    patientId: row.patient_id as string,
    date: row.date as string,
    time: row.time as string,
    reason: row.reason as string,
    acuityOD: (row.acuity_od as string) ?? null,
    acuityOS: (row.acuity_os as string) ?? null,
    iopOD: (row.iop_od as string) ?? null,
    iopOS: (row.iop_os as string) ?? null,
    notes: (row.notes as string) ?? null,
    createdAt: row.created_at as string
  }
}
