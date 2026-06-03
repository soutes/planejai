'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { X, Settings, CreditCard, FileText, TrendingDown } from 'lucide-react'

const STORAGE_KEY = 'planejAI:welcome:hide'

const steps = [
  {
    n: '1',
    Icon: Settings,
    title: 'Configure suas integrações',
    desc: 'Em Configurações, informe a chave de API da sua IA preferida (Claude, GPT ou Gemini) para ativar a leitura automática de faturas.',
    href: '/gestao',
    cta: 'Configurações',
    accent: '#E3F272',
  },
  {
    n: '2',
    Icon: CreditCard,
    title: 'Cadastre seus cartões',
    desc: 'Adicione cartões com limite, data de fechamento e proprietário. Cada cartão tem ciclo próprio.',
    href: '/gestao',
    cta: 'Cadastrar cartão',
    accent: '#F2811D',
  },
  {
    n: '3',
    Icon: FileText,
    title: 'Importe sua primeira fatura',
    desc: 'Faça upload do PDF ou imagem da fatura. A IA categoriza cada transação e gera relatório executivo.',
    href: '/cartao',
    cta: 'Ir para Cartão',
    accent: '#F2811D',
  },
  {
    n: '4',
    Icon: TrendingDown,
    title: 'Adicione despesas e rendimentos',
    desc: 'Lance despesas manuais, recorrentes ou parceladas. Registre rendimentos por fonte.',
    href: '/despesas',
    cta: 'Adicionar despesa',
    accent: '#10F5A3',
  },
]

export function WelcomeModal() {
  const [open, setOpen] = useState(false)
  const [dontShowAgain, setDontShowAgain] = useState(false)

  // Decide se mostra ao montar (1 vez por carregamento do app)
  useEffect(() => {
    try {
      const hide = localStorage.getItem(STORAGE_KEY) === '1'
      if (!hide) setOpen(true)
    } catch {
      setOpen(true)
    }
  }, [])

  function handleClose() {
    if (dontShowAgain) {
      try { localStorage.setItem(STORAGE_KEY, '1') } catch {}
    }
    setOpen(false)
  }

  if (!open) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 250,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.65)',
        backdropFilter: 'blur(4px)',
      }}
      onClick={handleClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(820px, 92vw)',
          background: '#0E1410',
          border: '1px solid rgba(255,255,255,0.10)',
          borderRadius: 20,
          padding: '28px 28px 24px',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 22 }}>
          <div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '4px 12px',
              borderRadius: 999,
              background: 'rgba(16,245,163,0.08)',
              border: '1px solid rgba(16,245,163,0.20)',
              marginBottom: 12,
            }}>
              <span style={{
                width: 6, height: 6, borderRadius: '50%',
                background: '#10F5A3',
                boxShadow: '0 0 6px rgba(16,245,163,0.8)',
              }} />
              <span style={{
                fontFamily: 'var(--font-mono, monospace)',
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: '0.12em',
                color: '#10F5A3',
                textTransform: 'uppercase',
              }}>
                Primeiro acesso
              </span>
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
              Bem-vindo ao <span style={{ color: '#10F5A3' }}>planejAÍ</span>
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', marginTop: 4, lineHeight: 1.5 }}>
              Para o app funcionar 100%, complete as 4 etapas abaixo. Você pode fechar este aviso e voltar quando quiser.
            </div>
          </div>
          <button
            onClick={handleClose}
            aria-label="Fechar"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.10)',
              borderRadius: 8,
              width: 32,
              height: 32,
              cursor: 'pointer',
              display: 'grid',
              placeItems: 'center',
              color: 'rgba(255,255,255,0.5)',
              flexShrink: 0,
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Steps grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 22 }}>
          {steps.map((step) => (
            <Link
              key={step.n}
              href={step.href}
              onClick={handleClose}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '14px 16px',
                background: `${step.accent}08`,
                border: `1px solid ${step.accent}22`,
                borderRadius: 12,
                textDecoration: 'none',
                color: 'inherit',
                transition: 'transform 0.15s ease, border-color 0.15s ease',
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLAnchorElement
                el.style.transform = 'translateX(3px)'
                el.style.borderColor = `${step.accent}55`
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLAnchorElement
                el.style.transform = 'translateX(0)'
                el.style.borderColor = `${step.accent}22`
              }}
            >
              <div style={{
                width: 30, height: 30,
                borderRadius: '50%',
                background: `${step.accent}18`,
                border: `1.5px solid ${step.accent}50`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
                fontFamily: 'var(--font-mono, monospace)',
                fontWeight: 700,
                fontSize: 13,
                color: step.accent,
              }}>
                {step.n}
              </div>
              <div style={{
                width: 32, height: 32,
                borderRadius: 8,
                background: `${step.accent}14`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
                color: step.accent,
              }}>
                <step.Icon size={16} strokeWidth={1.8} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: '#fff', marginBottom: 2 }}>
                  {step.title}
                </div>
                <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.50)', lineHeight: 1.5 }}>
                  {step.desc}
                </div>
              </div>
              <div style={{
                fontSize: 11,
                fontWeight: 600,
                color: step.accent,
                opacity: 0.75,
                flexShrink: 0,
                whiteSpace: 'nowrap',
              }}>
                {step.cta} →
              </div>
            </Link>
          ))}
        </div>

        {/* Footer: checkbox + OK */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          paddingTop: 18,
          borderTop: '1px solid rgba(255,255,255,0.08)',
        }}>
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: 9,
            cursor: 'pointer',
            fontSize: 13,
            color: 'rgba(255,255,255,0.65)',
            userSelect: 'none',
          }}>
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              style={{
                width: 16,
                height: 16,
                accentColor: '#10F5A3',
                cursor: 'pointer',
              }}
            />
            Não exibir novamente
          </label>
          <button
            onClick={handleClose}
            style={{
              padding: '9px 24px',
              borderRadius: 10,
              background: '#10F5A3',
              border: 'none',
              fontSize: 13,
              fontWeight: 700,
              color: '#0A1410',
              cursor: 'pointer',
              letterSpacing: '0.01em',
              transition: 'transform 0.15s ease, box-shadow 0.15s ease',
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLButtonElement
              el.style.transform = 'translateY(-1px)'
              el.style.boxShadow = '0 8px 20px -8px rgba(16,245,163,0.5)'
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLButtonElement
              el.style.transform = 'translateY(0)'
              el.style.boxShadow = 'none'
            }}
          >
            OK, entendi
          </button>
        </div>
      </div>
    </div>
  )
}
