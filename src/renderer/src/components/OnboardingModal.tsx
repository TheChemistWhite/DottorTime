import { useState } from 'react'
import type { DoctorSettings } from '@shared/types'

interface OnboardingModalProps {
  onCompleted: (doctor: DoctorSettings) => void
}

const emptyForm: DoctorSettings = {
  name: '',
  specialization: '',
  initials: ''
}

function deriveInitials(name: string): string {
  const words = name
    .replace(/^dr\.?\s*/i, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  if (words.length === 0) return ''
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return (words[0][0] + words[words.length - 1][0]).toUpperCase()
}

// Wizard di primo avvio: mostrato quando non esiste ancora alcun dato medico
// nel database (nessuna riga in tabella settings). Non è chiudibile: l'app
// resta bloccata qui finché non viene salvato almeno nome e specializzazione.
export default function OnboardingModal({ onCompleted }: OnboardingModalProps): React.JSX.Element {
  const [form, setForm] = useState<DoctorSettings>(emptyForm)
  const [initialsTouched, setInitialsTouched] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const setName = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const name = e.target.value
    setForm((f) => ({ ...f, name, initials: initialsTouched ? f.initials : deriveInitials(name) }))
  }

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    if (!form.name.trim() || !form.specialization.trim()) {
      setError('Nome e specializzazione sono obbligatori.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const saved = await window.api.settings.update({
        name: form.name.trim(),
        specialization: form.specialization.trim(),
        initials: (form.initials || deriveInitials(form.name)).trim().toUpperCase() || '??'
      })
      onCompleted(saved)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore durante il salvataggio.')
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay modal-overlay--onboarding">
      <div className="modal-card">
        <div className="modal-title">Benvenuto in DottorTime</div>
        <div className="settings-section__desc" style={{ marginBottom: 20 }}>
          Prima di iniziare, inserisci i tuoi dati: verranno mostrati nell&rsquo;app e salvati solo
          in locale su questo computer.
        </div>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 14 }}>
            <div className="form-label">Nome e cognome</div>
            <input
              className="form-input"
              placeholder="Es. Mario Rossi"
              value={form.name}
              onChange={setName}
              autoFocus
            />
          </div>
          <div style={{ marginBottom: 14 }}>
            <div className="form-label">Specializzazione</div>
            <input
              className="form-input"
              placeholder="Es. Oftalmologia"
              value={form.specialization}
              onChange={(e) => setForm((f) => ({ ...f, specialization: e.target.value }))}
            />
          </div>
          <div style={{ marginBottom: 8 }}>
            <div className="form-label">Iniziali (avatar sidebar)</div>
            <input
              className="form-input"
              style={{ width: 100 }}
              maxLength={3}
              value={form.initials}
              onChange={(e) => {
                setInitialsTouched(true)
                setForm((f) => ({ ...f, initials: e.target.value.toUpperCase() }))
              }}
            />
          </div>

          {error && <div className="form-error">{error}</div>}

          <div className="form-actions">
            <button type="submit" className="btn btn--primary btn--lg" disabled={saving}>
              {saving ? 'Salvataggio…' : 'Inizia'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
