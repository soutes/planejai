import { formatMoney } from './MoneyValue'

interface KpiCardProps {
  label: string
  value: number
  sub?: string
  colored?: boolean
  glow?: boolean
}

function HeroAmount({ value, colored }: { value: number; colored: boolean }) {
  const isNeg = value < 0
  const abs = Math.abs(value)
  const formatted = abs.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const commaIdx = formatted.lastIndexOf(',')
  const intPart = formatted.slice(0, commaIdx)
  const decPart = formatted.slice(commaIdx) // includes comma

  const color = colored
    ? value >= 0 ? 'var(--section-accent)' : 'var(--app-danger)'
    : 'var(--app-text)'

  return (
    <div
      className="mono"
      style={{ display: 'flex', alignItems: 'baseline', gap: 2, flexWrap: 'wrap', color }}
    >
      <span style={{ fontSize: 22, fontWeight: 500 }}>
        {isNeg ? '-' : ''}R$&nbsp;
      </span>
      <span style={{ fontSize: 64, fontWeight: 700, lineHeight: 1, letterSpacing: '-0.04em' }}>
        {intPart}
      </span>
      <span style={{ fontSize: 24, fontWeight: 500 }}>
        {decPart}
      </span>
    </div>
  )
}

export function KpiCard({ label, value, sub, colored = false, glow = false }: KpiCardProps) {
  const color = colored ? (value >= 0 ? 'var(--section-accent)' : 'var(--app-danger)') : 'var(--app-text)'

  return (
    <div className={glow ? 'af-glow' : 'gf-kpi'}>
      <div className="t-label" style={{ marginBottom: 8 }}>{label}</div>
      {glow ? (
        <HeroAmount value={value} colored={colored} />
      ) : (
        <div className="t-kpi mono" style={{ color }}>{formatMoney(value)}</div>
      )}
      {sub && (
        <div style={{ fontSize: 11, color: 'var(--app-text-faint)', marginTop: 5 }}>{sub}</div>
      )}
    </div>
  )
}
