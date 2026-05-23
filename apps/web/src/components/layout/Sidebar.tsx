'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  CreditCard,
  TrendingDown,
  TrendingUp,
  PieChart,
  FileText,
  Settings,
} from 'lucide-react'

const NAV_ITEMS = [
  { href: '/dashboard',     label: 'Dashboard',     Icon: LayoutDashboard },
  { href: '/despesas',      label: 'Despesas',       Icon: TrendingDown     },
  { href: '/rendimentos',   label: 'Rendimentos',    Icon: TrendingUp       },
  { href: '/investimentos', label: 'Investimentos',  Icon: PieChart         },
  { href: '/cartao',        label: 'Cartão',         Icon: CreditCard       },
  { href: '/relatorio',     label: 'Relatório',      Icon: FileText         },
  { href: '/gestao',        label: 'Gestão',         Icon: Settings         },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="app-sidebar">
      <div style={{ padding: '24px 18px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <div style={{
            width: 28, height: 28,
            background: 'linear-gradient(135deg, var(--app-accent), var(--app-accent-soft))',
            borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: 'var(--glow-green-soft)',
          }}>
            <span style={{ fontSize: 14, fontWeight: 800, color: '#08120D' }}>p</span>
          </div>
          <span style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 800,
            fontSize: 16,
            color: 'var(--app-text)',
            letterSpacing: '-0.3px',
          }}>
            planejAÍ
          </span>
        </div>
        <span style={{ fontSize: 10, color: 'var(--app-text-faint)', letterSpacing: '0.5px' }}>
          v2.0
        </span>
      </div>

      <nav style={{ flex: 1, padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {NAV_ITEMS.map(({ href, label, Icon }) => {
          const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={`sb-nav${isActive ? ' sb-nav--active' : ''}`}
            >
              <Icon size={16} strokeWidth={2} />
              {label}
            </Link>
          )
        })}
      </nav>

      <div style={{
        padding: '16px 18px',
        borderTop: '1px solid var(--app-border)',
        fontSize: 11,
        color: 'var(--app-text-faint)',
      }}>
        App local · offline-first
      </div>
    </aside>
  )
}
