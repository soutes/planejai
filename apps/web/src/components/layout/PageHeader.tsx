import { LucideIcon } from 'lucide-react'

interface PageHeaderProps {
  title: string
  subtitle?: string
  Icon?: LucideIcon
  action?: React.ReactNode
}

export function PageHeader({ title, subtitle, Icon, action }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        {Icon && (
          <div style={{
            width: 36, height: 36,
            background: 'rgba(16,245,163,0.08)',
            border: '1px solid rgba(16,245,163,0.2)',
            borderRadius: 'var(--radius-lg)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon size={18} color="var(--app-accent)" strokeWidth={2} />
          </div>
        )}
        <div>
          <h1 className="t-page-title">{title}</h1>
          {subtitle && (
            <p style={{ fontSize: 13, color: 'var(--app-text-muted)', marginTop: 2 }}>
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}
