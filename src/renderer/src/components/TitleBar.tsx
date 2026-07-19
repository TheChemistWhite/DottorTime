import { formatDateBadge } from '../lib/format'

interface TitleBarProps {
  doctorName: string
}

export default function TitleBar({ doctorName }: TitleBarProps): React.JSX.Element {
  const isMac = window.platform === 'darwin'

  return (
    <div className={`titlebar ${isMac ? 'titlebar--mac' : ''}`}>
      <span className="titlebar__title">Agenda — {doctorName}</span>
      <div className="titlebar__spacer" />
      <span className="titlebar__date">{formatDateBadge()}</span>
    </div>
  )
}
