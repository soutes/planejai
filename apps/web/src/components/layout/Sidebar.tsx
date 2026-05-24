'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  ChevronLeft, ChevronRight,
  LayoutDashboard, CreditCard, TrendingDown, TrendingUp, PieChart, FileText, Settings,
} from 'lucide-react'
import { useMesRef } from '@/shared/context/MesRefContext'
import { formatMesRefFull } from '@/shared/lib/format'

const NAV_ITEMS = [
  { href: '/dashboard',     label: 'Dashboard',     Icon: LayoutDashboard, color: '#12A09E' },
  { href: '/rendimentos',   label: 'Rendimentos',   Icon: TrendingUp,      color: '#5B996A' },
  { href: '/despesas',      label: 'Despesas',      Icon: TrendingDown,    color: '#D93232' },
  { href: '/cartao',        label: 'Cartão',        Icon: CreditCard,      color: '#F2811D' },
  { href: '/investimentos', label: 'Investimentos', Icon: PieChart,        color: '#7B6EF5' },
  { href: '/relatorio',     label: 'Relatório',     Icon: FileText,        color: '#F59E0B' },
]
const FOOTER_ITEM = { href: '/gestao', label: 'Configurações', Icon: Settings, color: '#E3F272' }

const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

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

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { mesRef, setMesRef } = useMesRef()

  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerYear, setPickerYear] = useState(() => parseInt(mesRef.split('-')[0]))
  const [pickerPos, setPickerPos] = useState({ top: 0, left: 0 })
  const dateRef = useRef<HTMLDivElement>(null)
  const pickerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setPickerYear(parseInt(mesRef.split('-')[0]))
  }, [mesRef])

  useEffect(() => {
    if (!pickerOpen) return
    function onDown(e: MouseEvent) {
      if (
        !pickerRef.current?.contains(e.target as Node) &&
        !dateRef.current?.contains(e.target as Node)
      ) {
        setPickerOpen(false)
      }
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [pickerOpen])

  function navigate(newMes: string) {
    setMesRef(newMes)
    if (pathname.startsWith('/dashboard')) {
      router.push(`/dashboard?mesRef=${newMes}`)
    }
  }

  function togglePicker() {
    if (!pickerOpen && dateRef.current) {
      const r = dateRef.current.getBoundingClientRect()
      setPickerPos({ top: r.top, left: r.right + 8 })
      setPickerYear(parseInt(mesRef.split('-')[0]))
    }
    setPickerOpen(v => !v)
  }

  function selectMonth(month: number) {
    const newMes = `${pickerYear}-${String(month).padStart(2, '0')}`
    navigate(newMes)
    setPickerOpen(false)
  }

  const arrowBtn = {
    background: 'none', border: 'none', cursor: 'pointer',
    color: 'rgba(255,255,255,0.40)', padding: '4px 6px', borderRadius: 6,
    display: 'flex', alignItems: 'center',
  } as const

  const [selYear, selMonthNum] = mesRef.split('-').map(Number)

  function renderNav({ href, label, Icon, color }: typeof NAV_ITEMS[0]) {
    const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
    return (
      <Link
        key={href}
        href={href}
        className={`sb-nav${isActive ? ' sb-nav--active' : ''}`}
        style={isActive ? { color, borderLeftColor: color, background: `${color}18` } : undefined}
      >
        <Icon size={18} strokeWidth={isActive ? 2.2 : 1.6} />
        <span>{label}</span>
      </Link>
    )
  }

  return (
    <>
      <aside className="app-sidebar">

        {/* Logo */}
        <div style={{ padding: '28px 20px 18px' }}>
          <div style={{ fontSize: 42, fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1, marginBottom: 5 }}>
            <span style={{ color: '#fff' }}>planej</span>
            <span style={{ color: '#10F5A3' }}>AÍ</span>
          </div>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase' as const }}>
            Planejamento financeiro
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', margin: '0 16px' }} />

        {/* Date selector */}
        <div style={{ padding: '14px 16px' }} ref={dateRef}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: pickerOpen ? 'rgba(16,245,163,0.06)' : 'rgba(255,255,255,0.04)',
            border: `1px solid ${pickerOpen ? 'rgba(16,245,163,0.30)' : 'rgba(255,255,255,0.08)'}`,
            borderRadius: 8,
            padding: '7px 8px',
            transition: 'background 0.15s, border-color 0.15s',
          }}>
            <button style={arrowBtn} onClick={() => navigate(prevMonth(mesRef))}>
              <ChevronLeft size={15} />
            </button>
            <button
              onClick={togglePicker}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 4px' }}
            >
              <span style={{
                fontSize: 13, fontWeight: 700,
                color: pickerOpen ? '#10F5A3' : '#10F5A3',
                letterSpacing: '-0.01em',
                userSelect: 'none' as const,
              }}>
                {formatMesRefFull(mesRef)}
              </span>
            </button>
            <button style={arrowBtn} onClick={() => navigate(nextMonth(mesRef))}>
              <ChevronRight size={15} />
            </button>
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', margin: '0 16px 8px' }} />

        {/* Main nav */}
        <nav style={{ flex: 1, padding: '4px 12px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {NAV_ITEMS.map(renderNav)}
        </nav>

        {/* Divider */}
        <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', margin: '0 16px 8px' }} />

        {/* Footer nav */}
        <div style={{ padding: '4px 12px 16px' }}>
          {renderNav(FOOTER_ITEM)}
        </div>

      </aside>

      {/* Custom Month Picker — fixed overlay to the right of sidebar */}
      {pickerOpen && (
        <div
          ref={pickerRef}
          style={{
            position: 'fixed',
            top: pickerPos.top,
            left: pickerPos.left,
            zIndex: 100,
            width: 212,
            background: '#111614',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 12,
            padding: '14px 12px',
            boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
          }}
        >
          {/* Year navigation */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <button
              onClick={() => setPickerYear(y => y - 1)}
              style={{ ...arrowBtn, color: 'rgba(255,255,255,0.50)' }}
            >
              <ChevronLeft size={15} />
            </button>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#fff', letterSpacing: '-0.01em' }}>
              {pickerYear}
            </span>
            <button
              onClick={() => setPickerYear(y => y + 1)}
              style={{ ...arrowBtn, color: 'rgba(255,255,255,0.50)' }}
            >
              <ChevronRight size={15} />
            </button>
          </div>

          {/* Month grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4 }}>
            {MESES.map((label, i) => {
              const monthNum = i + 1
              const isSelected = pickerYear === selYear && monthNum === selMonthNum
              return (
                <button
                  key={i}
                  onClick={() => selectMonth(monthNum)}
                  className={isSelected ? undefined : 'picker-month-btn'}
                  style={{
                    padding: '7px 0',
                    borderRadius: 7,
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 12,
                    fontWeight: isSelected ? 700 : 400,
                    background: isSelected ? '#10F5A3' : 'transparent',
                    color: isSelected ? '#0A0F0D' : 'rgba(255,255,255,0.55)',
                    transition: 'background 0.1s, color 0.1s',
                  }}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </>
  )
}
