import { useState } from 'react'
import type { DoctorSettings, ImportMode } from '@shared/types'

interface SettingsModalProps {
  doctor: DoctorSettings
  onClose: () => void
  onDoctorUpdated: (doctor: DoctorSettings) => void
  onDataImported: () => void
  onDataReset: () => void
}

export default function SettingsModal({
  doctor,
  onClose,
  onDoctorUpdated,
  onDataImported,
  onDataReset
}: SettingsModalProps): React.JSX.Element {
  const [form, setForm] = useState<DoctorSettings>(doctor)
  const [savingDoctor, setSavingDoctor] = useState(false)
  const [importMode, setImportMode] = useState<ImportMode>('merge')
  const [busy, setBusy] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [message, setMessage] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null)

  const saveDoctor = async (): Promise<void> => {
    setSavingDoctor(true)
    try {
      const updated = await window.api.settings.update(form)
      onDoctorUpdated(updated)
      setMessage({ kind: 'ok', text: 'Dati del medico aggiornati.' })
    } catch (err) {
      setMessage({ kind: 'error', text: err instanceof Error ? err.message : 'Errore.' })
    } finally {
      setSavingDoctor(false)
    }
  }

  const handleExport = async (): Promise<void> => {
    setBusy(true)
    setMessage(null)
    try {
      const result = await window.api.data.export()
      if (result.ok) {
        setMessage({ kind: 'ok', text: `Backup salvato in: ${result.filePath}` })
      } else if (!result.canceled) {
        setMessage({ kind: 'error', text: result.error ?? 'Esportazione non riuscita.' })
      }
    } finally {
      setBusy(false)
    }
  }

  const handleImport = async (): Promise<void> => {
    if (
      importMode === 'replace' &&
      !window.confirm(
        'Sei sicuro? La modalità "Sostituisci" cancella tutti i pazienti e le visite attuali e li rimpiazza con quelli del file importato. Questa operazione non è reversibile.'
      )
    ) {
      return
    }
    setBusy(true)
    setMessage(null)
    try {
      const result = await window.api.data.import(importMode)
      if (result.ok) {
        setMessage({
          kind: 'ok',
          text: `Importati ${result.patientsImported} pazienti e ${result.visitsImported} visite.`
        })
        onDataImported()
      } else {
        setMessage({ kind: 'error', text: result.error ?? 'Importazione non riuscita.' })
      }
    } finally {
      setBusy(false)
    }
  }

  const handleResetAll = async (): Promise<void> => {
    if (
      !window.confirm(
        'Cancellare TUTTI i dati? Pazienti, visite e dati del medico verranno eliminati in modo permanente e non recuperabile. Al riavvio dell\'app verrà richiesto di reinserire i dati del medico. Continuare?'
      )
    ) {
      return
    }
    setResetting(true)
    setMessage(null)
    try {
      await window.api.data.resetAll()
      onDataReset()
    } catch (err) {
      setMessage({ kind: 'error', text: err instanceof Error ? err.message : 'Errore.' })
      setResetting(false)
    }
  }

  return (
    <div className="modal-overlay" onMouseDown={onClose}>
      <div className="modal-card" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-title">Impostazioni</div>

        <div className="settings-section">
          <div className="settings-section__title">Dati medico</div>
          <div className="form-row">
            <div>
              <div className="form-label">Nome e cognome</div>
              <input
                className="form-input"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div>
              <div className="form-label">Specializzazione</div>
              <input
                className="form-input"
                value={form.specialization}
                onChange={(e) => setForm((f) => ({ ...f, specialization: e.target.value }))}
              />
            </div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <div className="form-label">Iniziali (avatar sidebar)</div>
            <input
              className="form-input"
              style={{ width: 100 }}
              maxLength={3}
              value={form.initials}
              onChange={(e) => setForm((f) => ({ ...f, initials: e.target.value.toUpperCase() }))}
            />
          </div>
          <button type="button" className="btn btn--secondary" onClick={saveDoctor} disabled={savingDoctor}>
            {savingDoctor ? 'Salvataggio…' : 'Salva dati medico'}
          </button>
        </div>

        <hr className="settings-divider" />

        <div className="settings-section">
          <div className="settings-section__title">Backup ed esportazione</div>
          <div className="settings-section__desc">
            Esporta tutti i pazienti, le visite e le note cliniche in un unico file locale, da
            conservare come backup o da trasferire su un altro computer.
          </div>
          <button type="button" className="btn btn--primary" onClick={handleExport} disabled={busy}>
            Esporta dati…
          </button>
        </div>

        <hr className="settings-divider" />

        <div className="settings-section">
          <div className="settings-section__title">Importazione dati</div>
          <div className="settings-section__desc">
            Scegli un file <code>.dottortime</code> esportato in precedenza. "Unisci" aggiunge o
            aggiorna i record senza toccare quelli non presenti nel file; "Sostituisci" cancella i
            dati attuali e li rimpiazza con quelli importati.
          </div>
          <div className="settings-radio-row">
            <label>
              <input
                type="radio"
                name="import-mode"
                checked={importMode === 'merge'}
                onChange={() => setImportMode('merge')}
              />
              Unisci
            </label>
            <label>
              <input
                type="radio"
                name="import-mode"
                checked={importMode === 'replace'}
                onChange={() => setImportMode('replace')}
              />
              Sostituisci tutto
            </label>
          </div>
          <button type="button" className="btn btn--secondary" onClick={handleImport} disabled={busy}>
            Importa dati…
          </button>
        </div>

        <hr className="settings-divider" />

        <div className="settings-section settings-section--danger">
          <div className="settings-section__title settings-section__title--danger">Zona pericolosa</div>
          <div className="settings-section__desc">
            Elimina in modo permanente tutti i pazienti, le visite e i dati del medico salvati su
            questo computer. Usalo per ripulire dati di prova prima di iniziare a usare l&rsquo;app
            davvero. L&rsquo;operazione non è reversibile: se ti serve un backup, esportalo prima.
          </div>
          <button
            type="button"
            className="btn btn--danger"
            onClick={handleResetAll}
            disabled={resetting}
          >
            {resetting ? 'Cancellazione…' : 'Cancella tutti i dati'}
          </button>
        </div>

        {message && (
          <div className={message.kind === 'ok' ? 'form-success' : 'form-error'} style={{ marginTop: 12 }}>
            {message.text}
          </div>
        )}

        <div className="form-actions">
          <button type="button" className="btn btn--secondary btn--lg" onClick={onClose}>
            Chiudi
          </button>
        </div>
      </div>
    </div>
  )
}
