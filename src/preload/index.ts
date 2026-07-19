import { contextBridge, ipcRenderer } from 'electron'
import { IPC } from '@shared/ipcChannels'
import type {
  DoctorSettings,
  ImportMode,
  PatientInput,
  PreloadApi,
  VisitInput
} from '@shared/types'

// API tipizzata e minimale esposta al renderer. Il renderer non ha mai
// accesso diretto a Node/Electron: passa sempre da qui.
// La forma è definita da PreloadApi (src/shared/types.ts) anziché inferita
// con `typeof`, così src/preload/index.d.ts può tipizzare `window.api` senza
// importare questo file (che usa `process`/`ipcRenderer` e non deve entrare
// nel programma TypeScript del renderer).
const api: PreloadApi = {
  patients: {
    list: (query?: string) => ipcRenderer.invoke(IPC.patientsList, query),
    get: (id: string) => ipcRenderer.invoke(IPC.patientsGet, id),
    create: (input: PatientInput) => ipcRenderer.invoke(IPC.patientsCreate, input),
    update: (id: string, input: Partial<PatientInput>) =>
      ipcRenderer.invoke(IPC.patientsUpdate, id, input)
  },
  visits: {
    create: (input: VisitInput) => ipcRenderer.invoke(IPC.visitsCreate, input),
    update: (id: string, input: VisitInput) => ipcRenderer.invoke(IPC.visitsUpdate, id, input)
  },
  dashboard: {
    stats: () => ipcRenderer.invoke(IPC.dashboardStats),
    appointments: (limit?: number) => ipcRenderer.invoke(IPC.dashboardAppointments, limit),
    appointmentsForDay: (dateIso: string) =>
      ipcRenderer.invoke(IPC.dashboardAppointmentsForDay, dateIso),
    calendar: (year: number, month: number) =>
      ipcRenderer.invoke(IPC.dashboardCalendar, year, month)
  },
  settings: {
    get: () => ipcRenderer.invoke(IPC.settingsGet),
    update: (input: DoctorSettings) => ipcRenderer.invoke(IPC.settingsUpdate, input)
  },
  data: {
    export: () => ipcRenderer.invoke(IPC.dataExport),
    import: (mode: ImportMode) => ipcRenderer.invoke(IPC.dataImport, mode),
    resetAll: () => ipcRenderer.invoke(IPC.dataResetAll)
  }
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('api', api)
    contextBridge.exposeInMainWorld('platform', process.platform)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-expect-error fallback di sviluppo se contextIsolation fosse disattivata
  window.api = api
  // @ts-expect-error vedi sopra
  window.platform = process.platform
}
