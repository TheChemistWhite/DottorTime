interface AvatarProps {
  initials: string
  size: number
  radius?: number
  variant?: 'gradient' | 'flat'
  fontSize?: number
}

export default function Avatar({
  initials,
  size,
  radius,
  variant = 'gradient',
  fontSize
}: AvatarProps): React.JSX.Element {
  return (
    <div
      className={`avatar ${variant === 'flat' ? 'avatar--flat' : ''}`}
      style={{
        width: size,
        height: size,
        borderRadius: radius ?? Math.round(size * 0.26),
        fontSize: fontSize ?? Math.round(size * 0.38)
      }}
    >
      {initials}
    </div>
  )
}
