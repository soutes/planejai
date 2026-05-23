interface MoneyValueProps {
  value: number | null | undefined
  className?: string
  colored?: boolean
  size?: 'sm' | 'md' | 'lg' | 'kpi'
}

export function formatMoney(value: number | null | undefined): string {
  return (value ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function MoneyValue({ value, className = '', colored = false, size = 'md' }: MoneyValueProps) {
  const sizeMap = { sm: '12px', md: '14px', lg: '16px', kpi: '23px' }
  const v = value ?? 0
  const color = colored ? (v >= 0 ? 'var(--app-accent)' : 'var(--app-danger)') : 'inherit'

  return (
    <span
      className={`mono ${className}`}
      style={{ fontSize: sizeMap[size], fontWeight: size === 'kpi' ? 800 : 700, color }}
    >
      {formatMoney(value)}
    </span>
  )
}
