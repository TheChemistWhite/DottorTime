import { useEffect, useState } from 'react'
import type { DoctorSettings, Patient, PatientSummary, Visit } from '@shared/types'
import TitleBar from './components/TitleBar'
import Sidebar from './components/Sidebar'
import PatientFormModal from './components/PatientFormModal'
import SettingsModal from './components/SettingsModal'
import OnboardingModal from './components/OnboardingModal'
import Dashboard from './screens/Dashboard'
import PatientDetail from './screens/PatientDetail'
import NewVisit from './screens/NewVisit'

export type Screen = 'dashboard' | 'patient' | 'newvisit'

export default function App(): React.JSX.Element {
  const [screen, setScreen] = useState<Screen>('dashboard')
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [patients, setPatients] = useState<PatientSummary[]>([])
  // null = nessun dato medico salvato ancora (primo avvio, o dopo un reset
  // completo dei dati): finché resta null viene mostrato solo l'onboarding.
  const [doctor, setDoctor] = useState<DoctorSettings | null>(null)
  const [doctorLoaded, setDoctorLoaded] = useState(false)
  const [showNewPatientModal, setShowNewPatientModal] = useState(false)
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null)
  const [editingVisit, setEditingVisit] = useState<Visit | null>(null)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    window.api.settings.get().then((d) => {
      setDoctor(d)
      setDoctorLoaded(true)
    })
  }, [])

  useEffect(() => {
    const handle = setTimeout(() => {
      window.api.patients.list(searchQuery).then((list: PatientSummary[]) => {
        setPatients(list)
        setSelectedPatientId((current) => current ?? list[0]?.id ?? null)
      })
    }, 150)
    return () => clearTimeout(handle)
  }, [searchQuery, refreshKey])

  const navigate = (target: Screen, patientId?: string): void => {
    setScreen(target)
    if (patientId) setSelectedPatientId(patientId)
    // Uscendo dalla schermata "nuova/modifica visita" verso qualunque altra
    // schermata, la sessione di modifica in corso (se c'era) va comunque
    // abbandonata: evita che una successiva "+ Nuova visita" riparta per
    // sbaglio precompilata con i dati dell'ultima visita modificata.
    if (target !== 'newvisit') setEditingVisit(null)
  }

  // Apre il form visita in modalità creazione, garantendo che non resti
  // agganciata una visita in modifica da una sessione precedente.
  const startNewVisit = (patientId?: string): void => {
    setEditingVisit(null)
    navigate('newvisit', patientId)
  }

  const startEditVisit = (visit: Visit): void => {
    navigate('newvisit', visit.patientId)
    setEditingVisit(visit)
  }

  const handlePatientSaved = (patient: Patient): void => {
    setShowNewPatientModal(false)
    setEditingPatient(null)
    setRefreshKey((k) => k + 1)
    navigate('patient', patient.id)
  }

  const handleVisitSaved = (patientId: string): void => {
    setEditingVisit(null)
    setRefreshKey((k) => k + 1)
    navigate('patient', patientId)
  }

  const handleNewVisitCancel = (): void => {
    setEditingVisit(null)
    navigate(selectedPatientId ? 'patient' : 'dashboard', selectedPatientId ?? undefined)
  }

  // Dopo "Cancella tutti i dati" (Impostazioni) l'app torna esattamente allo
  // stato di primo avvio: doctor null riporta l'onboarding in primo piano.
  const handleDataReset = (): void => {
    setShowSettingsModal(false)
    setShowNewPatientModal(false)
    setEditingPatient(null)
    setEditingVisit(null)
    setSelectedPatientId(null)
    setPatients([])
    setSearchQuery('')
    setScreen('dashboard')
    setDoctor(null)
    setRefreshKey((k) => k + 1)
  }

  // Attesa della prima lettura di window.api.settings.get(): evita un flash
  // dell'onboarding prima di sapere se il medico è già configurato.
  if (!doctorLoaded) {
    return <div className="app-shell" />
  }

  if (!doctor) {
    return <OnboardingModal onCompleted={setDoctor} />
  }

  return (
    <div className="app-shell">
      <TitleBar doctorName={doctor.name} />
      <div className="app-body">
        <Sidebar
          doctor={doctor}
          screen={screen}
          patients={patients}
          selectedPatientId={selectedPatientId}
          onNavigate={navigate}
          onNewVisit={startNewVisit}
          onOpenSettings={() => setShowSettingsModal(true)}
        />
        <div className="main-content">
          {screen === 'dashboard' && (
            <Dashboard
              doctorName={doctor.name}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onNewVisit={() => startNewVisit(selectedPatientId ?? undefined)}
              onOpenNewPatient={() => setShowNewPatientModal(true)}
              onSelectPatient={(id) => navigate('patient', id)}
              refreshKey={refreshKey}
            />
          )}
          {screen === 'patient' && selectedPatientId && (
            <PatientDetail
              patientId={selectedPatientId}
              onNewVisit={(id) => startNewVisit(id)}
              onEditPatient={(patient) => setEditingPatient(patient)}
              onEditVisit={startEditVisit}
              refreshKey={refreshKey}
            />
          )}
          {screen === 'patient' && !selectedPatientId && (
            <div className="screen-padding empty-state">
              Nessun paziente ancora registrato. Crea il primo paziente per iniziare.
            </div>
          )}
          {screen === 'newvisit' && (
            <NewVisit
              initialPatientId={selectedPatientId}
              editingVisit={editingVisit}
              onSaved={handleVisitSaved}
              onCancel={handleNewVisitCancel}
            />
          )}
        </div>
      </div>

      {showNewPatientModal && (
        <PatientFormModal onClose={() => setShowNewPatientModal(false)} onSaved={handlePatientSaved} />
      )}

      {editingPatient && (
        <PatientFormModal
          patient={editingPatient}
          onClose={() => setEditingPatient(null)}
          onSaved={handlePatientSaved}
        />
      )}

      {showSettingsModal && (
        <SettingsModal
          doctor={doctor}
          onClose={() => setShowSettingsModal(false)}
          onDoctorUpdated={setDoctor}
          onDataImported={() => setRefreshKey((k) => k + 1)}
          onDataReset={handleDataReset}
        />
      )}
    </div>
  )
}
