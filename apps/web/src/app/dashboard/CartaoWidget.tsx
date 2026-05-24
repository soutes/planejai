'use client'

import { useState, useEffect, useMemo } from 'react'
import { CreditCard, ArrowRight } from 'lucide-react'
import { formatMoney } from '@/components/ui/MoneyValue'
import { apiFetch } from '@/shared/lib/api'
import { usePersona } from '@/shared/context/PersonaContext'

interface CartaoApi {
  id: number
  nome: string
  finalDigitos: string | null
  cor: string
  limite: number | null
  diaFechamento: number
  ativo: boolean
  abaId: number | null
  abaPessoaId: number | null
}

interface FaturaApi {
  id: number
  cartaoId: number
  mesReferencia: string | null
  total: number | null
}

function calcDiasRestantes(diaFechamento: number): number {
  const today = new Date()
  const d = today.getDate()
  const m = today.getMonth()
  const y = today.getFullYear()
  const fim = d > diaFechamento ? new Date(y, m + 1, diaFechamento) : new Date(y, m, diaFechamento)
  return Math.max(0, Math.ceil((fim.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)))
}

function currentCycleMesRef(diaFechamento: number): string {
  const today = new Date()
  const d = today.getDate()
  const m = today.getMonth()
  const y = today.getFullYear()
  const fim = d > diaFechamento ? new Date(y, m + 1, diaFechamento) : new Date(y, m, diaFechamento)
  return `${fim.getFullYear()}-${String(fim.getMonth() + 1).padStart(2, '0')}`
}

export function CartaoWidget({ panelMode = false }: { panelMode?: boolean }) {
  const { pessoaId } = usePersona()
  const [cartoes, setCartoes] = useState<CartaoApi[]>([])
  const [latestTotals, setLatestTotals] = useState<Record<number, number>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiFetch<CartaoApi[]>('/api/cartoes')
      .then(async (rows) => {
        const ativos = rows.filter((c) => c.ativo)
        setCartoes(ativos)

        // Fetch latest fatura total for each cartão in parallel
        const results = await Promise.allSettled(
          ativos.map((c) =>
            apiFetch<FaturaApi[]>(`/api/faturas?cartaoId=${c.id}`).then((faturas) => {
              const mesRef = currentCycleMesRef(c.diaFechamento)
              const match = faturas.find((f) => f.mesReferencia === mesRef)
              return { cartaoId: c.id, total: match?.total ?? 0 }
            }),
          ),
        )

        const totals: Record<number, number> = {}
        results.forEach((r) => {
          if (r.status === 'fulfilled') totals[r.value.cartaoId] = r.value.total
        })
        setLatestTotals(totals)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // Filtra por persona selecionada no dashboard
  const visibleCartoes = useMemo(() => {
    if (pessoaId === null) {
      // Familiar: só cartões de abas familiares (pessoaId null)
      return cartoes.filter((c) => c.abaId !== null && c.abaPessoaId === null)
    }
    // Pessoa específica: só cartões da sua aba
    return cartoes.filter((c) => c.abaPessoaId === pessoaId)
  }, [cartoes, pessoaId])

  if (loading) return null
  if (visibleCartoes.length === 0) return null

  const pessoal = visibleCartoes.filter((c) => c.abaPessoaId !== null || c.abaId === null)
  const familiar = visibleCartoes.filter((c) => c.abaId !== null && c.abaPessoaId === null)

  function renderGroup(label: string, group: CartaoApi[], grupo: string) {
    if (group.length === 0) return null
    const groupTotal = group.reduce((s, c) => s + (latestTotals[c.id] ?? 0), 0)

    return (
      <div key={label} style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase' as const, letterSpacing: '0.08em' }}>{label}</span>
          <a
            href={`/cartao?grupo=${grupo}`}
            style={{ fontSize: 10, color: 'var(--section-accent, #12A09E)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 3 }}
          >
            Ver <ArrowRight size={10} />
          </a>
        </div>

        {!panelMode && group.length > 1 && (
          <div style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--app-text)' }}>{formatMoney(groupTotal)}</span>
              <span style={{ fontSize: 11, color: 'var(--app-text-faint)' }}>ciclo atual</span>
            </div>
          </div>
        )}

        {group.map((c) => {
          const total = latestTotals[c.id] ?? 0
          const diasRestantes = calcDiasRestantes(c.diaFechamento)
          const usedPct = c.limite && c.limite > 0 ? Math.min((total / c.limite) * 100, 100) : null
          return (
            <a
              key={c.id}
              href={`/cartao?grupo=${grupo}&cartaoId=${c.id}`}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', textDecoration: 'none' }}
            >
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: c.cor, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', fontWeight: 500 }}>
                    {c.nome}{c.finalDigitos ? ` ···${c.finalDigitos}` : ''}
                  </span>
                  <span className="mono" style={{ fontSize: 12, fontWeight: 600, color: total > 0 ? '#fff' : 'rgba(255,255,255,0.30)', fontVariantNumeric: 'tabular-nums' as const }}>
                    {formatMoney(total)}
                  </span>
                </div>
                {panelMode && usedPct !== null && (
                  <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 999, marginBottom: 4 }}>
                    <div style={{ height: '100%', width: `${usedPct}%`, background: c.cor, borderRadius: 999 }} />
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: panelMode && c.limite ? 'space-between' : 'flex-end' }}>
                  {panelMode && c.limite && c.limite > 0 && (
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.30)' }}>
                      de {formatMoney(c.limite)}
                    </span>
                  )}
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.30)', whiteSpace: 'nowrap' as const }}>
                    Fecha em {diasRestantes}d
                  </span>
                </div>
              </div>
            </a>
          )
        })}
      </div>
    )
  }

  const content = (
    <>
      {!panelMode && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <CreditCard size={15} style={{ color: 'var(--app-accent)' }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--app-text-2)' }}>Ciclo atual — Cartões</span>
        </div>
      )}
      {renderGroup('Pessoal', pessoal, 'pessoal')}
      {renderGroup('Familiar', familiar, 'familiar')}
    </>
  )

  if (panelMode) return content
  return <div className="af-card">{content}</div>
}
