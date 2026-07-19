// Nomi dei canali IPC condivisi tra main e preload, per evitare stringhe
// "magiche" duplicate nei due processi.
export const IPC = {
  patientsList: 'patients:list',
  patientsGet: 'patients:get',
  patientsCreate: 'patients:create',
  patientsUpdate: 'patients:update',
  visitsCreate: 'visits:create',
  visitsUpdate: 'visits:update',
  dashboardStats: 'dashboard:stats',
  dashboardAppointments: 'dashboard:appointments',
  dashboardAppointmentsForDay: 'dashboard:appointmentsForDay',
  dashboardCalendar: 'dashboard:calendar',
  settingsGet: 'settings:get',
  settingsUpdate: 'settings:update',
  dataExport: 'data:export',
  dataImport: 'data:import',
  dataResetAll: 'data:resetAll'
} as const
