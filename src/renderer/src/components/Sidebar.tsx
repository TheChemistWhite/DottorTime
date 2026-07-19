import type { DoctorSettings, PatientSummary } from '@shared/types'
import Avatar from './Avatar'
import type { Screen } from '../App'

interface SidebarProps {
  doctor: DoctorSettings
  screen: Screen
  patients: PatientSummary[]
  selectedPatientId: string | null
  onNavigate: (screen: Screen, patientId?: string) => void
  onNewVisit: (patientId?: string) => void
  onOpenSettings: () => void
}

export default function Sidebar({
  doctor,
  screen,
  patients,
  selectedPatientId,
  onNavigate,
  onNewVisit,
  onOpenSettings
}: SidebarProps): React.JSX.Element {
  const fallbackPatientId = selectedPatientId ?? patients[0]?.id

  return (
    <div className="sidebar">
      <div className="sidebar__doctor">
        <Avatar initials={doctor.initials} size={38} radius={10} />
        <div>
          <div className="sidebar__doctor-name">{doctor.name}</div>
          <div className="sidebar__doctor-spec">{doctor.specialization}</div>
        </div>
      </div>

      <div className="sidebar__section-label">Menu</div>
      <button
        type="button"
        className={`nav-item ${screen === 'dashboard' ? 'nav-item--active' : ''}`}
        onClick={() => onNavigate('dashboard')}
      >
        <span className={`nav-item__dot ${screen === 'dashboard' ? 'nav-item__dot--active' : ''}`} />
        <span>Dashboard</span>
      </button>
      <button
        type="button"
        className={`nav-item ${screen === 'patient' ? 'nav-item--active' : ''}`}
        onClick={() => fallbackPatientId && onNavigate('patient', fallbackPatientId)}
        disabled={!fallbackPatientId}
      >
        <span className={`nav-item__dot ${screen === 'patient' ? 'nav-item__dot--active' : ''}`} />
        <span>Pazienti</span>
      </button>
      <button
        type="button"
        className={`nav-item ${screen === 'newvisit' ? 'nav-item--active' : ''}`}
        onClick={() => onNewVisit(fallbackPatientId)}
      >
        <span className={`nav-item__dot ${screen === 'newvisit' ? 'nav-item__dot--active' : ''}`} />
        <span>Nuova visita</span>
      </button>

      <div className="sidebar__section-label sidebar__section-label--recent">Pazienti recenti</div>
      <div className="sidebar__recent-list">
        {patients.length === 0 && <div className="patient-row__empty">Nessun paziente trovato</div>}
        {patients.map((p) => (
          <button
            type="button"
            key={p.id}
            className={`patient-row ${
              screen === 'patient' && selectedPatientId === p.id ? 'patient-row--active' : ''
            }`}
            onClick={() => onNavigate('patient', p.id)}
          >
            <Avatar initials={p.initials} size={22} radius={6} variant="flat" fontSize={10} />
            <span className="patient-row__name">{p.name}</span>
          </button>
        ))}
      </div>

      <div className="sidebar__spacer" />
      <div className="sidebar__footer">
        <span>v1.0 · Studio Oculistico</span>
        <button
          type="button"
          className="sidebar__settings-btn"
          onClick={onOpenSettings}
          title="Impostazioni e backup dati"
          aria-label="Impostazioni e backup dati"
        >
          ⚙
        </button>
      </div>
    </div>
  )
}
