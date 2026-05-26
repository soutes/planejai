'use client'

import Link from 'next/link'
import { Settings, CreditCard, FileText, TrendingDown, ArrowLeft } from 'lucide-react'

const steps = [
  {
    n: '1',
    Icon: Settings,
    title: 'Configure suas integrações',
    desc: 'Acesse Configurações e informe a chave de API da sua IA preferida (Claude, GPT ou Gemini) para ativar a leitura automática de faturas.',
    href: '/gestao',
    cta: 'Ir para Configurações',
    accent: '#E3F272',
    bg: 'rgba(227,242,114,0.06)',
    border: 'rgba(227,242,114,0.18)',
  },
  {
    n: '2',
    Icon: CreditCard,
    title: 'Cadastre seus cartões',
    desc: 'Adicione seus cartões de crédito com limite, data de fechamento e proprietário. Cada cartão tem ciclo próprio — diferente do mês calendário.',
    href: '/gestao',
    cta: 'Cadastrar cartão',
    accent: '#F2811D',
    bg: 'rgba(242,129,29,0.06)',
    border: 'rgba(242,129,29,0.18)',
  },
  {
    n: '3',
    Icon: FileText,
    title: 'Importe sua primeira fatura',
    desc: 'Faça upload do PDF ou imagem da fatura. A IA lê, categoriza cada transação e gera relatório com top categorias e estabelecimentos.',
    href: '/cartao',
    cta: 'Ir para Cartão',
    accent: '#F2811D',
    bg: 'rgba(242,129,29,0.06)',
    border: 'rgba(242,129,29,0.18)',
  },
  {
    n: '4',
    Icon: TrendingDown,
    title: 'Adicione despesas e rendimentos',
    desc: 'Lance despesas manuais, recorrentes ou parceladas. Registre rendimentos por fonte. O dashboard começa a ganhar vida imediatamente.',
    href: '/despesas',
    cta: 'Adicionar despesa',
    accent: '#10F5A3',
    bg: 'rgba(16,245,163,0.06)',
    border: 'rgba(16,245,163,0.18)',
  },
]

export function OnboardingEmpty() {
  return (
    <div style={{
      minHeight: 'calc(100vh - 120px)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '48px 24px',
      position: 'relative',
    }}>

      {/* Glow ambiental */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: `
          radial-gradient(600px 400px at 50% 30%, rgba(16,245,163,0.07), transparent 60%),
          radial-gradient(400px 300px at 20% 80%, rgba(18,160,158,0.06), transparent 55%)
        `,
        pointerEvents: 'none',
      }} />

      {/* Conteúdo central */}
      <div style={{ position: 'relative', width: '100%', maxWidth: 780, zIndex: 1 }}>

        {/* Heading */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            padding: '6px 16px',
            borderRadius: 999,
            background: 'rgba(16,245,163,0.08)',
            border: '1px solid rgba(16,245,163,0.2)',
            marginBottom: 20,
          }}>
            <span style={{
              width: 7, height: 7, borderRadius: '50%',
              background: '#10F5A3',
              boxShadow: '0 0 8px rgba(16,245,163,0.8)',
              display: 'inline-block',
              animation: 'pulse-dot 2s ease-in-out infinite',
            }} />
            <span style={{
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.14em',
              color: '#10F5A3',
              textTransform: 'uppercase' as const,
            }}>
              Primeiro acesso
            </span>
          </div>

          <h1 style={{
            fontSize: 'clamp(1.8rem, 4vw, 2.8rem)',
            fontWeight: 800,
            letterSpacing: '-0.025em',
            lineHeight: 1.1,
            color: 'var(--app-text, #F6FBF9)',
            marginBottom: 14,
          }}>
            Bem-vindo ao{' '}
            <span style={{ color: '#10F5A3' }}>planejAÍ</span>
          </h1>
          <p style={{
            fontSize: '1.05rem',
            color: 'var(--app-text-faint, #8A9994)',
            maxWidth: '52ch',
            margin: '0 auto',
            lineHeight: 1.65,
          }}>
            Siga os passos abaixo para ativar o app e ter sua primeira visão financeira em minutos.
          </p>
        </div>

        {/* Steps */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {steps.map((step, i) => (
            <Link
              key={step.n}
              href={step.href}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 18,
                padding: '20px 24px',
                background: step.bg,
                border: `1px solid ${step.border}`,
                borderRadius: 14,
                textDecoration: 'none',
                color: 'inherit',
                transition: 'transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease',
                animationDelay: `${i * 80}ms`,
              }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLAnchorElement
                el.style.transform = 'translateX(4px)'
                el.style.boxShadow = `0 12px 32px -12px ${step.accent}40`
                el.style.borderColor = `${step.accent}50`
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLAnchorElement
                el.style.transform = 'translateX(0)'
                el.style.boxShadow = 'none'
                el.style.borderColor = step.border
              }}
            >
              {/* Number circle */}
              <div style={{
                width: 36, height: 36,
                borderRadius: '50%',
                background: `${step.accent}18`,
                border: `1.5px solid ${step.accent}50`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
                fontFamily: 'var(--font-mono, monospace)',
                fontWeight: 700,
                fontSize: 14,
                color: step.accent,
              }}>
                {step.n}
              </div>

              {/* Icon */}
              <div style={{
                width: 36, height: 36,
                borderRadius: 10,
                background: `${step.accent}14`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
                color: step.accent,
              }}>
                <step.Icon size={18} strokeWidth={1.8} />
              </div>

              {/* Text */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontWeight: 700,
                  fontSize: '0.98rem',
                  color: 'var(--app-text, #F6FBF9)',
                  marginBottom: 4,
                }}>
                  {step.title}
                </div>
                <div style={{
                  fontSize: '0.88rem',
                  color: 'var(--app-text-faint, #8A9994)',
                  lineHeight: 1.55,
                }}>
                  {step.desc}
                </div>
              </div>

              {/* CTA arrow */}
              <div style={{
                alignSelf: 'center',
                fontSize: 12,
                fontWeight: 600,
                color: step.accent,
                opacity: 0.7,
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                whiteSpace: 'nowrap' as const,
              }}>
                {step.cta} →
              </div>
            </Link>
          ))}
        </div>

        {/* Skip hint */}
        <p style={{
          textAlign: 'center',
          marginTop: 28,
          fontSize: '0.82rem',
          color: 'var(--app-text-faint, #5A6964)',
          fontFamily: 'var(--font-mono, monospace)',
          letterSpacing: '0.04em',
        }}>
          Pode explorar à vontade — o dashboard vai evoluindo conforme você adiciona dados.
        </p>
      </div>

      {/* Arrow callout → Configurações (bottom-left, aponta pra sidebar) */}
      <div style={{
        position: 'fixed',
        left: 208,          /* logo após o sidebar */
        bottom: 28,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        zIndex: 10,
        animation: 'slide-in-arrow 0.6s ease 0.4s both',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '9px 16px 9px 12px',
          background: 'rgba(227,242,114,0.10)',
          border: '1px solid rgba(227,242,114,0.30)',
          borderRadius: 999,
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
        }}>
          <ArrowLeft
            size={16}
            color="#E3F272"
            style={{ animation: 'bounce-left 1.4s ease-in-out infinite' }}
          />
          <span style={{
            fontSize: 12,
            fontWeight: 600,
            color: '#E3F272',
            fontFamily: 'var(--font-mono, monospace)',
            letterSpacing: '0.06em',
          }}>
            Configurações está aqui
          </span>
          <Settings size={13} color="#E3F272" />
        </div>
      </div>

      <style>{`
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.5; transform: scale(0.85); }
        }
        @keyframes bounce-left {
          0%, 100% { transform: translateX(0); }
          50%       { transform: translateX(-5px); }
        }
        @keyframes slide-in-arrow {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
