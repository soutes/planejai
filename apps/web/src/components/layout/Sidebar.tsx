'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import {
  ChevronLeft, ChevronRight,
  LayoutDashboard, CreditCard, TrendingDown, TrendingUp, PieChart, FileText, Settings,
  Heart, ExternalLink, X,
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

function PixIcon({ size = 26, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 800 800" fill={color}>
      <path d="M595.85,585.5c-27.28.06-53.45-10.78-72.7-30.1l-105-105c-7.72-7.33-19.83-7.33-27.55,0l-105.4,105.4c-19.24,19.33-45.42,30.17-72.7,30.1h-20.7l133,133c41.5,41.5,108.85,41.5,150.35,0l133.35-133.4h-12.65,0ZM212.5,214.1c27.5,0,53.3,10.7,72.7,30.1l105.4,105.4c7.61,7.62,19.96,7.63,27.58.02,0,0,.02-.02.02-.02l105-105c19.23-19.32,45.39-30.16,72.65-30.1h12.65l-133.35-133.35c-41.53-41.5-108.82-41.5-150.35,0l-133,133h20.7v-.05Z"/>
      <path d="M718.85,324.8l-80.6-80.6c-1.81.74-3.74,1.13-5.7,1.15h-36.65c-18.95,0-37.5,7.7-50.85,21.1l-105,105c-19.57,19.68-51.39,19.76-71.06.19-.06-.06-.12-.12-.19-.19l-105.4-105.45c-13.52-13.47-31.82-21.05-50.9-21.1h-45c-1.87-.01-3.71-.37-5.45-1.05l-80.9,80.95c-41.5,41.5-41.5,108.85,0,150.4l80.9,80.9c1.72-.69,3.55-1.06,5.4-1.1h45.05c19,0,37.5-7.65,50.9-21.05l105.35-105.45c19.97-19.01,51.33-19.01,71.3,0l105,105c13.35,13.4,31.9,21.05,50.85,21.05h36.65c2,0,3.95.5,5.7,1.2l80.6-80.6c41.5-41.5,41.5-108.9,0-150.4v.05Z"/>
    </svg>
  )
}

function ContribuirPanel({ onClose }: { onClose: () => void }) {
  const cards = [
    {
      color: '#10F5A3',
      bg: 'rgba(16,245,163,.04)',
      border: 'rgba(16,245,163,.15)',
      iconBg: 'rgba(16,245,163,.08)',
      btnBg: 'rgba(16,245,163,.10)',
      btnBorder: 'rgba(16,245,163,.28)',
      icon: <PixIcon size={26} color="#10F5A3" />,
      title: 'Pix',
      text: 'Aponte a câmera do seu app bancário para o QR Code abaixo. A transferência será feita para Luiz Augusto Soutes via Nubank.',
      content: (
        <div style={{
          background: '#fff',
          borderRadius: 12,
          padding: 10,
          display: 'inline-flex',
        }}>
          <Image
            src="/QR_Contribuicao_Planejai.png"
            alt="QR Code Pix"
            width={120}
            height={120}
            style={{ display: 'block' }}
          />
        </div>
      ),
    },
    {
      color: '#F2811D',
      bg: 'rgba(242,129,29,.04)',
      border: 'rgba(242,129,29,.15)',
      iconBg: 'rgba(242,129,29,.08)',
      btnBg: 'rgba(242,129,29,.10)',
      btnBorder: 'rgba(242,129,29,.28)',
      icon: <img src="https://static.vakinha.com.br/uploads/vakinha/image/971869/Logo-Vakinha-2017-icone-com-contorno-branco.png" width={26} alt="Vakinha" />,
      title: 'Vaquinha',
      text: 'Contribua com um café ☕ pela plataforma de crowdfunding. Qualquer valor vale.',
      link: { href: 'https://www.vakinha.com.br/vaquinha/planejai', label: 'Contribuir na Vakinha' },
    },
    {
      color: '#B07AFF',
      bg: 'rgba(176,122,255,.04)',
      border: 'rgba(176,122,255,.15)',
      iconBg: 'rgba(176,122,255,.08)',
      btnBg: 'rgba(176,122,255,.10)',
      btnBorder: 'rgba(176,122,255,.28)',
      icon: (
        <svg width={26} height={26} viewBox="0 0 24 24" fill="#B07AFF">
          <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.342-3.369-1.342-.454-1.155-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0 1 12 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.202 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
        </svg>
      ),
      title: 'GitHub',
      text: 'Uma ⭐ no repositório não custa nada — e significa muito para um dev solo.',
      link: { href: 'https://github.com/soutes/planejai', label: 'Ver repositório' },
    },
  ]

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 200,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(0,0,0,0.65)',
      backdropFilter: 'blur(4px)',
    }} onClick={onClose}>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: 'min(860px, 92vw)',
          background: '#0E1410',
          border: '1px solid rgba(255,255,255,0.10)',
          borderRadius: 20,
          padding: '28px 28px 32px',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
              Apoie o planejAÍ
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>
              Desenvolvido por uma pessoa, para pessoas.
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)',
              borderRadius: 8, width: 32, height: 32, cursor: 'pointer',
              display: 'grid', placeItems: 'center', color: 'rgba(255,255,255,0.5)',
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Cards grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 16,
        }}>
          {cards.map(card => (
            <div key={card.title} style={{
              background: card.bg,
              border: `1px solid ${card.border}`,
              borderRadius: 16,
              padding: '20px 18px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 14,
              textAlign: 'center',
            }}>
              {/* Icon */}
              <div style={{
                width: 48, height: 48, borderRadius: 12,
                background: card.iconBg,
                display: 'grid', placeItems: 'center',
              }}>
                {card.icon}
              </div>

              {/* Title */}
              <div style={{ fontSize: 15, fontWeight: 700, color: card.color, letterSpacing: '-0.01em' }}>
                {card.title}
              </div>

              {/* Text */}
              <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.55)', lineHeight: 1.55 }}>
                {card.text}
              </div>

              {/* Content or link */}
              {card.content && card.content}
              {card.link && (
                <a
                  href={card.link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 7,
                    padding: '7px 16px', borderRadius: 8,
                    background: card.btnBg,
                    border: `1px solid ${card.btnBorder}`,
                    fontSize: '0.78rem', fontWeight: 600,
                    color: card.color, textDecoration: 'none',
                    marginTop: 'auto',
                  }}
                >
                  {card.link.label}
                  <ExternalLink size={12} />
                </a>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
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

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { mesRef, setMesRef } = useMesRef()

  const [contribuirOpen, setContribuirOpen] = useState(false)
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

        {/* Contribuir button */}
        <div style={{ padding: '0 12px 6px' }}>
          <button
            onClick={() => setContribuirOpen(true)}
            className="sb-nav"
            style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
          >
            <Heart size={18} strokeWidth={1.6} />
            <span>Contribuir</span>
          </button>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', margin: '0 16px 8px' }} />

        {/* Footer nav */}
        <div style={{ padding: '4px 12px 16px' }}>
          {renderNav(FOOTER_ITEM)}
        </div>

      </aside>

      {/* Contribuir modal */}
      {contribuirOpen && <ContribuirPanel onClose={() => setContribuirOpen(false)} />}

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
