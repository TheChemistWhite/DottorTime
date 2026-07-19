// Tipi condivisi tra main, preload e renderer.
// Nessuna logica qui: solo forme dei dati e contratti IPC.

export interface Patient {
  id: string
  firstName: string
  lastName: string
  dob: string | null // ISO date (YYYY-MM-DD) o null se sconosciuta
  phone: string | null
  email: string | null
  address: string | null
  diagnosis: string | null
  createdAt: string
  updatedAt: string
}

export interface PatientInput {
  firstName: string
  lastName: string
  dob?: string | null
  phone?: string | null
  email?: string | null
  address?: string | null
  diagnosis?: string | null
}

export interface Visit {
  id: string
  patientId: string
  date: string // ISO date YYYY-MM-DD
  time: string // HH:mm
  reason: string
  acuityOD: string | null
  acuityOS: string | null
  iopOD: string | null
  iopOS: string | null
  notes: string | null
  createdAt: string
}

export interface VisitInput {
  patientId: string
  date: string
  time: string
  reason: string
  acuityOD?: string | null
  acuityOS?: string | null
  iopOD?: string | null
  iopOS?: string | null
  notes?: string | null
}

// Paziente con l'elenco delle proprie visite, così come lo consuma la
// schermata di dettaglio paziente.
export interface PatientWithVisits extends Patient {
  visits: Visit[]
}

// Riga sintetica per la lista "pazienti recenti"/ricerca in sidebar.
export interface PatientSummary {
  id: string
  name: string
  initials: string
}

export interface DoctorSettings {
  name: string
  specialization: string
  initials: string
}

export interface DashboardStats {
  visiteOggi: number
  pazientiTotali: number
  prossimoOra: string | null
  prossimoPaziente: string | null
  noteInAttesa: number
}

export interface UpcomingAppointment {
  visitId: string
  patientId: string
  patientName: string
  date: string
  time: string
  reason: string
}

export interface CalendarDay {
  date: string // ISO date
  num: number
  hasAppt: boolean
}

export interface CalendarMonth {
  label: string // es. "Luglio 2026"
  weekdayLabels: string[]
  days: CalendarDay[] // include celle vuote iniziali come num=0
  todayIso: string
}

// ---- Import / Export ----

export const DATA_SCHEMA_VERSION = 1

export interface ExportPayload {
  schemaVersion: number
  exportedAt: string
  appVersion: string
  doctor: DoctorSettings
  patients: Patient[]
  visits: Visit[]
}

export type ImportMode = 'replace' | 'merge'

export interface ImportResult {
  ok: boolean
  patientsImported: number
  visitsImported: number
  error?: string
}

export interface ExportResult {
  ok: boolean
  filePath?: string
  canceled?: boolean
  error?: string
}

// Forma dell'API esposta dal preload al renderer via contextBridge
// (window.api). Definita qui — non derivata da `typeof` sull'implementazione
// del preload — così il renderer può tipizzarla senza importare codice che
// gira in contesto Node/Electron (preload/index.ts usa `process`, ipcRenderer…
// e non deve mai finire nel programma TypeScript del renderer).
export interface PreloadApi {
  patients: {
    list: (query?: string) => Promise<PatientSummary[]>
    get: (id: string) => Promise<PatientWithVisits | null>
    create: (input: PatientInput) => Promise<Patient>
    update: (id: string, input: Partial<PatientInput>) => Promise<Patient | null>
  }
  visits: {
    create: (input: VisitInput) => Promise<Visit>
    update: (id: string, input: VisitInput) => Promise<Visit | null>
  }
  dashboard: {
    stats: () => Promise<DashboardStats>
    appointments: (limit?: number) => Promise<UpcomingAppointment[]>
    appointmentsForDay: (dateIso: string) => Promise<UpcomingAppointment[]>
    calendar: (year: number, month: number) => Promise<CalendarMonth>
  }
  settings: {
    get: () => Promise<DoctorSettings>
    update: (input: DoctorSettings) => Promise<DoctorSettings>
  }
  data: {
    export: () => Promise<ExportResult>
    import: (mode: ImportMode) => Promise<ImportResult>
  }
}
