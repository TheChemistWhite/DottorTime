import { useEffect, useState } from 'react'
import type { CalendarMonth, DashboardStats, UpcomingAppointment } from '@shared/types'
import StatCard from '../components/StatCard'
import CalendarCard from '../components/CalendarCard'
import AppointmentsCard from '../components/AppointmentsCard'
import { formatDateLong, formatDateLongFromIso } from '../lib/format'

interface DashboardProps {
  doctorName: string
  searchQuery: string
  onSearchChange: (q: string) => void
  onNewVisit: () => void
  onOpenNewPatient: () => void
  onSelectPatient: (patientId: string) => void
  refreshKey: number
}

export default function Dashboard({
  doctorName,
  searchQuery,
  onSearchChange,
  onNewVisit,
  onOpenNewPatient,
  onSelectPatient,
  refreshKey
}: DashboardProps): React.JSX.Element {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [upcoming, setUpcoming] = useState<UpcomingAppointment[]>([])
  const [month, setMonth] = useState<CalendarMonth | null>(null)
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [dayAppointments, setDayAppointments] = useState<UpcomingAppointment[]>([])
  const [loadingDay, setLoadingDay] = useState(false)

  useEffect(() => {
    const now = new Date()
    Promise.all([
      window.api.dashboard.stats(),
      window.api.dashboard.appointments(6),
      window.api.dashboard.calendar(now.getFullYear(), now.getMonth() + 1)
    ]).then(([s, a, m]) => {
      setStats(s)
      setUpcoming(a)
      setMonth(m)
    })
    // Deselezioniamo il giorno del calendario quando i dati cambiano (nuova
    // visita salvata altrove, import dati…) per evitare di mostrare una
    // vista del giorno ormai non aggiornata.
    setSelectedDay(null)
  }, [refreshKey])

  useEffect(() => {
    if (!selectedDay) return
    setLoadingDay(true)
    window.api.dashboard.appointmentsForDay(selectedDay).then((list) => {
      setDayAppointments(list)
      setLoadingDay(false)
    })
  }, [selectedDay, refreshKey])

  // "Dr. Giuseppe Francione" -> "Dr. Francione", coerente col mockup che
  // saluta con titolo + cognome.
  const nameParts = doctorName.trim().split(/\s+/)
  const shortName =
    nameParts.length > 1 && /^dr\.?$/i.test(nameParts[0])
      ? `${nameParts[0]} ${nameParts[nameParts.length - 1]}`
      : doctorName

  const handleSelectDay = (dateIso: string): void => {
    setSelectedDay((current) => (current === dateIso ? null : dateIso))
  }

  return (
    <div className="screen-padding">
      <div className="dashboard-header">
        <div>
          <div className="dashboard-header__greeting">Buongiorno, {shortName}</div>
          <div className="dashboard-header__date">{formatDateLong()}</div>
        </div>
        <div className="dashboard-header__actions">
          <input
            type="text"
            className="search-input"
            placeholder="Cerca paziente…"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          <button type="button" className="btn btn--secondary" onClick={onOpenNewPatient}>
            + Nuovo paziente
          </button>
          <button type="button" className="btn btn--primary" onClick={onNewVisit}>
            + Nuova visita
          </button>
        </div>
      </div>

      <div className="stat-grid">
        <StatCard label="Visite oggi" value={stats?.visiteOggi ?? '—'} />
        <StatCard label="Pazienti totali" value={stats?.pazientiTotali ?? '—'} />
        <StatCard
          label="Prossimo appuntamento"
          value={stats?.prossimoOra ?? '—'}
          sub={stats?.prossimoPaziente ?? 'Nessuno in programma'}
          small
        />
        <StatCard label="In attesa di note" value={stats?.noteInAttesa ?? '—'} accent />
      </div>

      <div className="dashboard-grid">
        <CalendarCard month={month} selectedDay={selectedDay} onSelectDay={handleSelectDay} />
        {selectedDay ? (
          <AppointmentsCard
            title={formatDateLongFromIso(selectedDay)}
            appointments={loadingDay ? [] : dayAppointments}
            onSelectPatient={onSelectPatient}
            emptyLabel={loadingDay ? 'Caricamento…' : 'Nessun appuntamento in questa giornata.'}
            onClearSelection={() => setSelectedDay(null)}
          />
        ) : (
          <AppointmentsCard
            title="Prossimi appuntamenti"
            appointments={upcoming}
            onSelectPatient={onSelectPatient}
          />
        )}
      </div>
    </div>
  )
}
