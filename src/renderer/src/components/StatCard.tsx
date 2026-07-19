interface StatCardProps {
  label: string
  value: string | number
  sub?: string
  accent?: boolean
  small?: boolean
}

export default function StatCard({
  label,
  value,
  sub,
  accent = false,
  small = false
}: StatCardProps): React.JSX.Element {
  return (
    <div className={`stat-card ${accent ? 'stat-card--accent' : ''}`}>
      <div className="stat-card__label">{label}</div>
      <div className={`stat-card__value ${small ? 'stat-card__value--sm' : ''}`}>{value}</div>
      {sub && <div className="stat-card__sub">{sub}</div>}
    </div>
  )
}
