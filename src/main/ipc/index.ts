import { ipcMain } from 'electron'
import { IPC } from '@shared/ipcChannels'
import type { PatientInput, VisitInput, DoctorSettings, ImportMode } from '@shared/types'
import {
  listPatientSummaries,
  getPatient,
  getPatientVisits,
  createPatient,
  updatePatient
} from '../db/patients'
import {
  createVisit,
  updateVisit,
  getDashboardStats,
  getUpcomingAppointments,
  getAppointmentsForDay,
  getCalendarMonth
} from '../db/visits'
import { getDoctorSettings, updateDoctorSettings } from '../db/settings'
import { exportData, importData } from '../dataTransfer'

export function registerIpcHandlers(): void {
  ipcMain.handle(IPC.patientsList, (_e, query?: string) => listPatientSummaries(query))

  ipcMain.handle(IPC.patientsGet, (_e, id: string) => {
    const patient = getPatient(id)
    if (!patient) return null
    const visits = getPatientVisits(id)
    return { ...patient, visits }
  })

  ipcMain.handle(IPC.patientsCreate, (_e, input: PatientInput) => createPatient(input))

  ipcMain.handle(IPC.patientsUpdate, (_e, id: string, input: Partial<PatientInput>) =>
    updatePatient(id, input)
  )

  ipcMain.handle(IPC.visitsCreate, (_e, input: VisitInput) => createVisit(input))

  ipcMain.handle(IPC.visitsUpdate, (_e, id: string, input: VisitInput) => updateVisit(id, input))

  ipcMain.handle(IPC.dashboardStats, () => getDashboardStats())

  ipcMain.handle(IPC.dashboardAppointments, (_e, limit?: number) =>
    getUpcomingAppointments(limit)
  )

  ipcMain.handle(IPC.dashboardAppointmentsForDay, (_e, dateIso: string) =>
    getAppointmentsForDay(dateIso)
  )

  ipcMain.handle(IPC.dashboardCalendar, (_e, year: number, month: number) =>
    getCalendarMonth(year, month)
  )

  ipcMain.handle(IPC.settingsGet, () => getDoctorSettings())

  ipcMain.handle(IPC.settingsUpdate, (_e, input: DoctorSettings) => updateDoctorSettings(input))

  ipcMain.handle(IPC.dataExport, () => exportData())

  ipcMain.handle(IPC.dataImport, (_e, mode: ImportMode) => importData(mode))
}
