import { useEffect, useState } from 'react'
import type { Patient, PatientWithVisits, Visit } from '@shared/types'
import Avatar from '../components/Avatar'
import { calculateAge, formatDateShort } from '../lib/format'

interface PatientDetailProps {
  patientId: string
  onNewVisit: (patientId: string) => void
  onEditPatient: (patient: Patient) => void
  onEditVisit: (visit: Visit) => void
  refreshKey: number
}

export default function PatientDetail({
  patientId,
  onNewVisit,
  onEditPatient,
  onEditVisit,
  refreshKey
}: PatientDetailProps): React.JSX.Element {
  const [patient, setPatient] = useState<PatientWithVisits | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    window.api.patients.get(patientId).then((p) => {
      setPatient(p)
      setLoading(false)
    })
  }, [patientId, refreshKey])

  if (loading) {
    return <div className="screen-padding empty-state">Caricamento…</div>
  }

  if (!patient) {
    return <div className="screen-padding empty-state">Paziente non trovato.</div>
  }

  const initials = `${patient.firstName.charAt(0)}${patient.lastName.charAt(0)}`.toUpperCase()
  const age = calculateAge(patient.dob)
  const lastVisit = patient.visits[0]?.date ?? null

  return (
    <div className="screen-padding">
      <div className="patient-header">
        <div className="patient-header__info">
          <Avatar initials={initials} size={64} radius={16} fontSize={22} />
          <div>
            <div className="patient-header__name">
              {patient.firstName} {patient.lastName}
            </div>
            <div className="patient-header__meta">
              {age !== null ? `${age} anni · ` : ''}
              {patient.phone ?? 'Telefono non indicato'}
              {patient.diagnosis ? ` · ${patient.diagnosis}` : ''}
            </div>
          </div>
        </div>
        <div className="patient-header__actions">
          <button type="button" className="btn btn--secondary" onClick={() => onEditPatient(patient)}>
            Modifica paziente
          </button>
          <button type="button" className="btn btn--primary" onClick={() => onNewVisit(patient.id)}>
            + Nuova visita
          </button>
        </div>
      </div>

      <div className="patient-grid">
        <div className="card">
          <div className="card__title">Anagrafica</div>
          <div className="field-list">
            <FieldRow label="Data di nascita" value={formatDateShort(patient.dob)} />
            <FieldRow label="Telefono" value={patient.phone ?? '—'} />
            <FieldRow label="Email" value={patient.email ?? '—'} />
            <FieldRow label="Indirizzo" value={patient.address ?? '—'} />
            <FieldRow label="Diagnosi principale" value={patient.diagnosis ?? '—'} />
            <FieldRow label="Ultima visita" value={formatDateShort(lastVisit)} />
          </div>
        </div>

        <div className="card">
          <div className="card__title">Storico visite e note cliniche</div>
          <div className="visit-history">
            {patient.visits.length === 0 && (
              <div className="empty-state">Nessuna visita registrata per questo paziente.</div>
            )}
            {patient.visits.map((v) => (
              <div key={v.id} className="visit-card">
                <div className="visit-card__head">
                  <div className="visit-card__date">{formatDateShort(v.date)}</div>
                  <div className="visit-card__head-right">
                    <span className="badge">{v.reason}</span>
                    <button
                      type="button"
                      className="visit-card__edit-btn"
                      onClick={() => onEditVisit(v)}
                      title="Modifica questa visita"
                      aria-label="Modifica questa visita"
                    >
                      Modifica
                    </button>
                  </div>
                </div>
                <div className="visit-card__params">
                  <div className="visit-card__param">
                    <div className="visit-card__param-label">Acuità visiva OD / OS</div>
                    <div className="visit-card__param-value">
                      {v.acuityOD || '—'} / {v.acuityOS || '—'}
                    </div>
                  </div>
                  <div className="visit-card__param">
                    <div className="visit-card__param-label">Pressione (PIO) OD / OS</div>
                    <div className="visit-card__param-value">
                      {v.iopOD || '—'} / {v.iopOS || '—'} mmHg
                    </div>
                  </div>
                </div>
                {v.notes && <div className="visit-card__notes">{v.notes}</div>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function FieldRow({ label, value }: { label: string; value: string }): React.JSX.Element {
  return (
    <div className="field-row">
      <span className="field-row__label">{label}</span>
      <span className="field-row__value">{value}</span>
    </div>
  )
}
