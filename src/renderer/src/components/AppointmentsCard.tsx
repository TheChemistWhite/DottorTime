import type { UpcomingAppointment } from '@shared/types'

interface AppointmentsCardProps {
  title: string
  appointments: UpcomingAppointment[]
  onSelectPatient: (patientId: string) => void
  emptyLabel?: string
  onClearSelection?: () => void
}

export default function AppointmentsCard({
  title,
  appointments,
  onSelectPatient,
  emptyLabel = 'Nessun appuntamento in programma.',
  onClearSelection
}: AppointmentsCardProps): React.JSX.Element {
  return (
    <div className="card">
      <div className="appt-card-head">
        <div className="card__title">{title}</div>
        {onClearSelection && (
          <button type="button" className="appt-card-head__reset" onClick={onClearSelection}>
            Mostra prossimi
          </button>
        )}
      </div>
      <div className="appt-list">
        {appointments.length === 0 && <div className="empty-state">{emptyLabel}</div>}
        {appointments.map((appt) => (
          <button
            type="button"
            key={appt.visitId}
            className="appt-row"
            onClick={() => onSelectPatient(appt.patientId)}
          >
            <div className="appt-row__time">{appt.time}</div>
            <div className="appt-row__divider" />
            <div className="appt-row__body">
              <div className="appt-row__name">{appt.patientName}</div>
              <div className="appt-row__reason">{appt.reason}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
