// Utility di formattazione data/ora in italiano. Nessuna dipendenza esterna:
// Intl è già disponibile nel runtime Chromium/Node di Electron.

export function isoToday(): string {
  return new Date().toISOString().slice(0, 10)
}

export function formatDateShort(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = new Date(`${iso}T00:00:00`)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function formatDateLong(date: Date = new Date()): string {
  const s = date.toLocaleDateString('it-IT', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export function formatDateLongFromIso(iso: string): string {
  const d = new Date(`${iso}T00:00:00`)
  if (Number.isNaN(d.getTime())) return iso
  return formatDateLong(d)
}

export function formatDateBadge(date: Date = new Date()): string {
  return date.toLocaleDateString('it-IT', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

export function calculateAge(dob: string | null | undefined): number | null {
  if (!dob) return null
  const birth = new Date(`${dob}T00:00:00`)
  if (Number.isNaN(birth.getTime())) return null
  const now = new Date()
  let age = now.getFullYear() - birth.getFullYear()
  const m = now.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--
  return age
}
