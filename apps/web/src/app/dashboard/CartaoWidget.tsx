'use client'

import { useState, useEffect } from 'react'
import { CreditCard, ArrowRight } from 'lucide-react'
import { formatMoney } from '@/components/ui/MoneyValue'
import { apiFetch } from '@/shared/lib/api'

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

export function CartaoWidget() {
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

  if (loading) return null
  if (cartoes.length === 0) return null

  const pessoal = cartoes.filter((c) => c.abaPessoaId !== null || c.abaId === null)
  const familiar = cartoes.filter((c) => c.abaId !== null && c.abaPessoaId === null)

  function renderGroup(label: string, group: CartaoApi[], grupo: string) {
    if (group.length === 0) return null
    const groupTotal = group.reduce((s, c) => s + (latestTotals[c.id] ?? 0), 0)

    return (
      <div key={label} style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--app-text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>{label}</span>
          <a
            href={`/cartao?grupo=${grupo}`}
            style={{ fontSize: 11, color: 'var(--app-accent)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 3 }}
          >
            Ver detalhes <ArrowRight size={11} />
          </a>
        </div>

        {group.length > 1 && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--app-text)' }}>{formatMoney(groupTotal)}</span>
              <span style={{ fontSize: 11, color: 'var(--app-text-faint)' }}>ciclo atual</span>
            </div>
          </div>
        )}

        {group.map((c) => {
          const total = latestTotals[c.id] ?? 0
          const diasRestantes = calcDiasRestantes(c.diaFechamento)
          return (
            <a
              key={c.id}
              href={`/cartao?grupo=${grupo}&cartaoId=${c.id}`}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', textDecoration: 'none' }}
            >
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: c.cor, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ fontSize: 12, color: 'var(--app-text)', fontWeight: 500 }}>
                    {c.nome}{c.finalDigitos ? ` ···${c.finalDigitos}` : ''}
                  </span>
                  <span className="mono" style={{ fontSize: 12, fontWeight: 700, color: total > 0 ? 'var(--app-text)' : 'var(--app-text-faint)' }}>
                    {formatMoney(total)}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <span style={{ fontSize: 10, color: 'var(--app-text-faint)', whiteSpace: 'nowrap' }}>
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

  return (
    <div className="af-card">
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <CreditCard size={15} style={{ color: 'var(--app-accent)' }} />
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--app-text-2)' }}>Ciclo atual — Cartões</span>
      </div>
      {renderGroup('Pessoal', pessoal, 'pessoal')}
      {renderGroup('Familiar', familiar, 'familiar')}
    </div>
  )
}
