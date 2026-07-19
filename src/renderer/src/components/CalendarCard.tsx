import type { CalendarMonth } from '@shared/types'

interface CalendarCardProps {
  month: CalendarMonth | null
  selectedDay: string | null
  onSelectDay: (dateIso: string) => void
}

export default function CalendarCard({
  month,
  selectedDay,
  onSelectDay
}: CalendarCardProps): React.JSX.Element {
  return (
    <div className="card">
      <div className="calendar-head">
        <div className="calendar-head__label">{month?.label ?? ''}</div>
        <div className="calendar-head__legend">
          Legenda:
          <span className="calendar-head__legend-dot" />
          appuntamenti
        </div>
      </div>
      <div className="calendar-weekdays">
        {(month?.weekdayLabels ?? []).map((d) => (
          <div key={d} className="calendar-weekdays__cell">
            {d}
          </div>
        ))}
      </div>
      <div className="calendar-days">
        {(month?.days ?? []).map((day, i) => {
          const isToday = day.date !== '' && day.date === month?.todayIso
          const isSelected = day.date !== '' && day.date === selectedDay
          const blank = day.date === ''
          return (
            <button
              type="button"
              key={day.date || `blank-${i}`}
              disabled={blank}
              onClick={() => day.date && onSelectDay(day.date)}
              className={`calendar-day ${blank ? 'calendar-day--blank' : ''} ${
                isToday ? 'calendar-day--today' : ''
              } ${isSelected ? 'calendar-day--selected' : ''}`}
            >
              <span className={`calendar-day__num ${isToday ? 'calendar-day__num--today' : ''}`}>
                {day.num || ''}
              </span>
              {day.hasAppt && <div className="calendar-day__dot" />}
            </button>
          )
        })}
      </div>
    </div>
  )
}
