import { useEffect, useState } from 'react'
import type { PatientSummary, Visit, VisitInput } from '@shared/types'
import { isoToday } from '../lib/format'

interface NewVisitProps {
  initialPatientId: string | null
  /** Se presente, il form lavora in modalità modifica su questa visita. */
  editingVisit?: Visit | null
  onSaved: (patientId: string) => void
  onCancel: () => void
}

function nowHm(): string {
  return new Date().toTimeString().slice(0, 5)
}

const baseForm = (patientId: string): VisitInput => ({
  patientId,
  reason: '',
  date: isoToday(),
  time: nowHm(),
  acuityOD: '',
  acuityOS: '',
  iopOD: '',
  iopOS: '',
  notes: ''
})

function visitToForm(visit: Visit): VisitInput {
  return {
    patientId: visit.patientId,
    reason: visit.reason,
    date: visit.date,
    time: visit.time,
    acuityOD: visit.acuityOD ?? '',
    acuityOS: visit.acuityOS ?? '',
    iopOD: visit.iopOD ?? '',
    iopOS: visit.iopOS ?? '',
    notes: visit.notes ?? ''
  }
}

export default function NewVisit({
  initialPatientId,
  editingVisit,
  onSaved,
  onCancel
}: NewVisitProps): React.JSX.Element {
  const isEdit = Boolean(editingVisit)
  const [patients, setPatients] = useState<PatientSummary[]>([])
  const [form, setForm] = useState<VisitInput>(
    editingVisit ? visitToForm(editingVisit) : baseForm(initialPatientId ?? '')
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    window.api.patients.list().then((list: PatientSummary[]) => {
      setPatients(list)
      setForm((f) => ({ ...f, patientId: f.patientId || initialPatientId || list[0]?.id || '' }))
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!isEdit && initialPatientId) {
      setForm((f) => ({ ...f, patientId: initialPatientId }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPatientId])

  const setField =
    (field: keyof VisitInput) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    if (!form.patientId) {
      setError('Seleziona un paziente.')
      return
    }
    if (!form.reason.trim()) {
      setError('Indica il motivo della visita.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const visit = isEdit
        ? await window.api.visits.update(editingVisit!.id, form)
        : await window.api.visits.create(form)
      if (!visit) {
        setError('Visita non trovata: potrebbe essere stata rimossa.')
        return
      }
      onSaved(visit.patientId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore durante il salvataggio della visita.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="screen-padding">
      <div className="form-card">
        <div className="form-title">{isEdit ? 'Modifica visita' : 'Nuova visita'}</div>
        <div className="form-subtitle">
          {isEdit
            ? 'Aggiorna i dettagli di questa visita oftalmologica'
            : 'Registra una nuova visita oftalmologica'}
        </div>

        <div className="card">
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div>
                <div className="form-label">Paziente</div>
                <select className="form-select" value={form.patientId} onChange={setField('patientId')}>
                  {patients.length === 0 && <option value="">Nessun paziente disponibile</option>}
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <div className="form-label">Motivo della visita</div>
                <input
                  type="text"
                  className="form-input"
                  value={form.reason}
                  onChange={setField('reason')}
                  placeholder="es. Controllo di routine"
                />
              </div>
            </div>

            <div className="form-row">
              <div>
                <div className="form-label">Data</div>
                <input type="date" className="form-input" value={form.date} onChange={setField('date')} />
              </div>
              <div>
                <div className="form-label">Ora</div>
                <input type="time" className="form-input" value={form.time} onChange={setField('time')} />
              </div>
            </div>

            <div className="form-section-label">Parametri oftalmologici</div>

            <div className="form-row">
              <div>
                <div className="form-label">Acuità visiva OD</div>
                <input
                  type="text"
                  className="form-input"
                  value={form.acuityOD ?? ''}
                  onChange={setField('acuityOD')}
                  placeholder="es. 10/10"
                />
              </div>
              <div>
                <div className="form-label">Acuità visiva OS</div>
                <input
                  type="text"
                  className="form-input"
                  value={form.acuityOS ?? ''}
                  onChange={setField('acuityOS')}
                  placeholder="es. 10/10"
                />
              </div>
            </div>

            <div className="form-row">
              <div>
                <div className="form-label">Pressione oculare OD (mmHg)</div>
                <input
                  type="text"
                  className="form-input"
                  value={form.iopOD ?? ''}
                  onChange={setField('iopOD')}
                  placeholder="es. 16"
                />
              </div>
              <div>
                <div className="form-label">Pressione oculare OS (mmHg)</div>
                <input
                  type="text"
                  className="form-input"
                  value={form.iopOS ?? ''}
                  onChange={setField('iopOS')}
                  placeholder="es. 16"
                />
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <div className="form-label">Note cliniche</div>
              <textarea
                className="form-textarea"
                rows={4}
                value={form.notes ?? ''}
                onChange={setField('notes')}
                placeholder="Osservazioni, terapia prescritta, follow-up…"
              />
            </div>

            {error && <div className="form-error">{error}</div>}

            <div className="form-actions">
              <button type="button" className="btn btn--secondary btn--lg" onClick={onCancel}>
                Annulla
              </button>
              <button type="submit" className="btn btn--primary btn--lg" disabled={saving}>
                {saving ? 'Salvataggio…' : isEdit ? 'Salva modifiche' : 'Salva visita'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
