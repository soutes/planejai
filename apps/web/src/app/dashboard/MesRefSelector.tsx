'use client'

import { useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'

interface MesRefSelectorProps {
  mesRef: string
}

function prevMonth(mes: string): string {
  const [y, m] = mes.split('-').map(Number)
  const d = new Date(y, m - 2, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function nextMonth(mes: string): string {
  const [y, m] = mes.split('-').map(Number)
  const d = new Date(y, m, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function formatLabel(mes: string): string {
  const [y, m] = mes.split('-').map(Number)
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
  return `${months[m - 1]} ${y}`
}

export function MesRefSelector({ mesRef }: MesRefSelectorProps) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  const navigate = (mes: string) => router.push(`/dashboard?mesRef=${mes}`)

  const openPicker = () => {
    try { inputRef.current?.showPicker() } catch { inputRef.current?.click() }
  }

  return (
    <div className="flex items-center gap-2" style={{
      background: 'var(--app-card)',
      border: '1px solid var(--app-border)',
      borderRadius: 'var(--radius-lg)',
      padding: '6px 12px',
      position: 'relative',
    }}>
      <button
        onClick={() => navigate(prevMonth(mesRef))}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--app-text-muted)', padding: 4 }}
      >
        <ChevronLeft size={16} />
      </button>

      <button
        onClick={openPicker}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 6, padding: '0 2px',
        }}
      >
        <Calendar size={14} style={{ color: 'white' }} />
        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--app-text)', minWidth: 72, textAlign: 'center' }}>
          {formatLabel(mesRef)}
        </span>
      </button>

      <button
        onClick={() => navigate(nextMonth(mesRef))}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--app-text-muted)', padding: 4 }}
      >
        <ChevronRight size={16} />
      </button>

      <input
        ref={inputRef}
        type="month"
        value={mesRef}
        onChange={(e) => { if (e.target.value) navigate(e.target.value) }}
        style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', width: 0, height: 0, top: 0, left: 0 }}
        tabIndex={-1}
      />
    </div>
  )
}
