import { useState } from 'react'
import type { Patient, PatientInput } from '@shared/types'

interface PatientFormModalProps {
  /** Se presente, il modale lavora in modalità modifica su questo paziente. */
  patient?: Patient | null
  onClose: () => void
  onSaved: (patient: Patient) => void
}

const emptyForm: PatientInput = {
  firstName: '',
  lastName: '',
  dob: '',
  phone: '',
  email: '',
  address: '',
  diagnosis: ''
}

function patientToForm(patient: Patient): PatientInput {
  return {
    firstName: patient.firstName,
    lastName: patient.lastName,
    dob: patient.dob ?? '',
    phone: patient.phone ?? '',
    email: patient.email ?? '',
    address: patient.address ?? '',
    diagnosis: patient.diagnosis ?? ''
  }
}

export default function PatientFormModal({
  patient,
  onClose,
  onSaved
}: PatientFormModalProps): React.JSX.Element {
  const isEdit = Boolean(patient)
  const [form, setForm] = useState<PatientInput>(patient ? patientToForm(patient) : emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const set = (field: keyof PatientInput) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    if (!form.firstName.trim() || !form.lastName.trim()) {
      setError('Nome e cognome sono obbligatori.')
      return
    }
    setSaving(true)
    setError(null)
    const payload: PatientInput = {
      ...form,
      dob: form.dob || null,
      phone: form.phone || null,
      email: form.email || null,
      address: form.address || null,
      diagnosis: form.diagnosis || null
    }
    try {
      const saved = isEdit
        ? await window.api.patients.update(patient!.id, payload)
        : await window.api.patients.create(payload)
      if (!saved) {
        setError('Paziente non trovato: potrebbe essere stato rimosso.')
        return
      }
      onSaved(saved)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore durante il salvataggio.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay" onMouseDown={onClose}>
      <div className="modal-card" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-title">{isEdit ? 'Modifica paziente' : 'Nuovo paziente'}</div>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div>
              <div className="form-label">Nome</div>
              <input
                className="form-input"
                value={form.firstName}
                onChange={set('firstName')}
                autoFocus
              />
            </div>
            <div>
              <div className="form-label">Cognome</div>
              <input className="form-input" value={form.lastName} onChange={set('lastName')} />
            </div>
          </div>
          <div className="form-row">
            <div>
              <div className="form-label">Data di nascita</div>
              <input type="date" className="form-input" value={form.dob ?? ''} onChange={set('dob')} />
            </div>
            <div>
              <div className="form-label">Telefono</div>
              <input className="form-input" value={form.phone ?? ''} onChange={set('phone')} />
            </div>
          </div>
          <div className="form-row">
            <div>
              <div className="form-label">Email</div>
              <input type="email" className="form-input" value={form.email ?? ''} onChange={set('email')} />
            </div>
            <div>
              <div className="form-label">Indirizzo</div>
              <input className="form-input" value={form.address ?? ''} onChange={set('address')} />
            </div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <div className="form-label">Diagnosi principale</div>
            <input className="form-input" value={form.diagnosis ?? ''} onChange={set('diagnosis')} />
          </div>

          {error && <div className="form-error">{error}</div>}

          <div className="form-actions">
            <button type="button" className="btn btn--secondary btn--lg" onClick={onClose}>
              Annulla
            </button>
            <button type="submit" className="btn btn--primary btn--lg" disabled={saving}>
              {saving ? 'Salvataggio…' : isEdit ? 'Salva modifiche' : 'Crea paziente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
