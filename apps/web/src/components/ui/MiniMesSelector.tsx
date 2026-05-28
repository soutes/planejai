'use client'

import { useRef } from 'react'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'

export function prevMonth(mes: string): string {
  const [y, m] = mes.split('-').map(Number)
  const d = new Date(y, m - 2, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function nextMonth(mes: string): string {
  const [y, m] = mes.split('-').map(Number)
  const d = new Date(y, m, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function formatMesLabel(mes: string): string {
  const [y, m] = mes.split('-').map(Number)
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
  return `${months[m - 1]} ${y}`
}

interface Props {
  value: string
  onChange: (v: string) => void
  disabled?: boolean
}

export function MiniMesSelector({ value, onChange, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)

  const openPicker = () => {
    if (disabled) return
    try { inputRef.current?.showPicker() } catch { inputRef.current?.click() }
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 4,
      background: 'var(--app-card)', border: '1px solid var(--app-border)',
      borderRadius: 'var(--radius-lg)', padding: '6px 10px',
      opacity: disabled ? 0.4 : 1, position: 'relative',
    }}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange(prevMonth(value))}
        style={{ background: 'none', border: 'none', cursor: disabled ? 'not-allowed' : 'pointer', color: 'var(--app-text-muted)', padding: 2 }}
      >
        <ChevronLeft size={14} />
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={openPicker}
        style={{
          background: 'none', border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
          display: 'flex', alignItems: 'center', gap: 5, padding: '0 2px',
        }}
      >
        <Calendar size={13} style={{ color: 'white' }} />
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--app-text)', minWidth: 64, textAlign: 'center' }}>
          {formatMesLabel(value)}
        </span>
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange(nextMonth(value))}
        style={{ background: 'none', border: 'none', cursor: disabled ? 'not-allowed' : 'pointer', color: 'var(--app-text-muted)', padding: 2 }}
      >
        <ChevronRight size={14} />
      </button>
      <input
        ref={inputRef}
        type="month"
        value={value}
        onChange={(e) => { if (e.target.value) onChange(e.target.value) }}
        style={{
          position: 'absolute', opacity: 0, pointerEvents: 'none',
          width: 0, height: 0, top: 0, left: 0, colorScheme: 'dark',
        }}
        tabIndex={-1}
      />
    </div>
  )
}
