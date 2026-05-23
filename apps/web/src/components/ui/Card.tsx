interface CardProps {
  children: React.ReactNode
  title?: string
  className?: string
  style?: React.CSSProperties
}

export function Card({ children, title, className = '', style }: CardProps) {
  return (
    <div className={`af-card ${className}`} style={style}>
      {title && (
        <div style={{
          fontSize: 13,
          fontWeight: 700,
          color: 'var(--app-text-2)',
          marginBottom: 16,
          letterSpacing: 0.2,
        }}>
          {title}
        </div>
      )}
      {children}
    </div>
  )
}
