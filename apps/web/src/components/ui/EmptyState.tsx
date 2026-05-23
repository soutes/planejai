import { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  subtitle?: string
  ctaLabel?: string
  ctaHref?: string
  ctaOnClick?: () => void
}

export function EmptyState({ icon: Icon, title, subtitle, ctaLabel, ctaHref, ctaOnClick }: EmptyStateProps) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '64px 24px',
      gap: 12,
      textAlign: 'center',
    }}>
      <Icon size={48} strokeWidth={1.5} style={{ color: 'var(--app-text-faint)' }} />
      <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--app-text)', margin: 0 }}>{title}</p>
      {subtitle && (
        <p style={{ fontSize: 13, color: 'var(--app-text-faint)', margin: 0, maxWidth: 360, lineHeight: 1.5 }}>{subtitle}</p>
      )}
      {ctaLabel && ctaHref && (
        <a
          href={ctaHref}
          className="af-btn af-btn--primary"
          style={{ marginTop: 8, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          {ctaLabel}
        </a>
      )}
      {ctaLabel && ctaOnClick && (
        <button
          onClick={ctaOnClick}
          className="af-btn af-btn--primary"
          style={{ marginTop: 8 }}
        >
          {ctaLabel}
        </button>
      )}
    </div>
  )
}
