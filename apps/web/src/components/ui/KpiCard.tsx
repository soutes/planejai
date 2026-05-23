import { formatMoney } from './MoneyValue'

interface KpiCardProps {
  label: string
  value: number
  sub?: string
  colored?: boolean
  glow?: boolean
}

export function KpiCard({ label, value, sub, colored = false, glow = false }: KpiCardProps) {
  const color = colored ? (value >= 0 ? 'var(--app-accent)' : 'var(--app-danger)') : 'var(--app-text)'

  return (
    <div className={glow ? 'af-glow' : 'gf-kpi'}>
      <div className="t-label" style={{ marginBottom: 8 }}>{label}</div>
      <div className="t-kpi mono" style={{ color }}>{formatMoney(value)}</div>
      {sub && (
        <div style={{ fontSize: 11, color: 'var(--app-text-faint)', marginTop: 5 }}>{sub}</div>
      )}
    </div>
  )
}
