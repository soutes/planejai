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
            width: 42, height: 42,
            background: 'color-mix(in srgb, var(--section-accent, #10F5A3) 12%, transparent)',
            border: '1px solid color-mix(in srgb, var(--section-accent, #10F5A3) 28%, transparent)',
            borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon size={20} color="var(--section-accent, #10F5A3)" strokeWidth={2} />
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
