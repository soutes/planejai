'use client'

import { useState, useEffect, useMemo } from 'react'
import { KpiCard } from '@/components/ui/KpiCard'
import { apiFetch } from '@/shared/lib/api'

interface Pessoa { id: number; nome: string; cor: string; ativo: boolean; familiar: boolean }
interface Aba { id: number; nome: string; cor: string; pessoaId: number | null }
interface SplitInfo { pessoaId: number; ratio: number; valorCalculado: number }
interface Despesa { id: number; abaId: number; valor: number; categoria: string; tipo: string; splits?: SplitInfo[] }

interface Props {
  mesRef: string
  globalDespesas: number
  totalRendimentos: number
  totalInvestido: number
  globalPorAba: { aba: string; valor: number }[]
  globalPorCategoria: { categoria: string; valor: number }[]
}

function moneyFmt(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function DashboardPersonaKpis({
  mesRef, globalDespesas, totalRendimentos, totalInvestido, globalPorAba, globalPorCategoria,
}: Props) {
  const [pessoas, setPessoas] = useState<Pessoa[]>([])
  const [abas, setAbas] = useState<Aba[]>([])
  const [despesas, setDespesas] = useState<Despesa[]>([])
  const [abaId, setAbaId] = useState<number | null>(null)

  const tabAbas = useMemo(() => {
    const pessoais = abas.filter((a) => a.pessoaId != null)
    const familiar = abas.find((a) => a.pessoaId == null)
    return familiar ? [...pessoais, familiar] : pessoais
  }, [abas])

  const familiarAbaId = useMemo(() => abas.find((a) => a.pessoaId == null)?.id ?? null, [abas])
  const abaMap = useMemo(() => new Map(abas.map((a) => [a.id, a])), [abas])

  const pessoaSelecionada = useMemo(() => {
    const aba = abas.find((a) => a.id === abaId)
    return aba?.pessoaId != null ? pessoas.find((p) => p.id === aba.pessoaId) ?? null : null
  }, [abaId, abas, pessoas])

  useEffect(() => {
    Promise.all([
      apiFetch<Pessoa[]>('/api/pessoas'),
      apiFetch<Aba[]>('/api/abas'),
    ]).then(([p, a]) => {
      setPessoas(p)
      setAbas(a)
    }).catch(() => {})
  }, [])

  useEffect(() => {
    apiFetch<Despesa[]>(`/api/despesas?mesRef=${mesRef}`)
      .then(setDespesas)
      .catch(() => {})
  }, [mesRef])

  useEffect(() => {
    if (abaId == null && tabAbas.length > 0) setAbaId(tabAbas[0].id)
  }, [tabAbas, abaId])

  const filtered = useMemo(() => {
    if (abaId == null) return null
    return despesas.filter((d) => {
      if (d.abaId === abaId) return true
      if (pessoaSelecionada && d.abaId === familiarAbaId && d.splits?.some((s) => s.pessoaId === pessoaSelecionada.id)) {
        return true
      }
      return false
    })
  }, [despesas, abaId, familiarAbaId, pessoaSelecionada])

  const efetivo = useMemo(() => (d: Despesa): number => {
    if (pessoaSelecionada && d.abaId === familiarAbaId && d.splits) {
      const meu = d.splits.find((s) => s.pessoaId === pessoaSelecionada.id)
      if (meu) return d.valor * meu.ratio
    }
    return d.valor
  }, [pessoaSelecionada, familiarAbaId])

  const totalDespesas = filtered != null
    ? filtered.reduce((s, d) => s + efetivo(d), 0)
    : globalDespesas
  const saldo = totalRendimentos - totalDespesas

  const porAba = useMemo(() => {
    if (filtered == null) return globalPorAba
    const map = new Map<string, number>()
    for (const d of filtered) {
      const nome = abaMap.get(d.abaId)?.nome ?? 'Desconhecida'
      map.set(nome, (map.get(nome) ?? 0) + efetivo(d))
    }
    return Array.from(map.entries()).map(([aba, valor]) => ({ aba, valor })).sort((a, b) => b.valor - a.valor)
  }, [filtered, abaMap, efetivo, globalPorAba])

  const porCategoria = useMemo(() => {
    if (filtered == null) return globalPorCategoria
    const map = new Map<string, number>()
    for (const d of filtered) {
      map.set(d.categoria, (map.get(d.categoria) ?? 0) + efetivo(d))
    }
    return Array.from(map.entries()).map(([categoria, valor]) => ({ categoria, valor })).sort((a, b) => b.valor - a.valor)
  }, [filtered, efetivo, globalPorCategoria])

  const breakdown = (
    <div className="grid-2 mt-6">
      <div className="af-card">
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--app-text-muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Despesas por Aba
        </div>
        {porAba.map((a) => (
          <div key={a.aba} className="flex items-center justify-between" style={{
            padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: 14,
          }}>
            <span style={{ color: 'var(--ink-400)' }}>{a.aba}</span>
            <span className="mono" style={{ fontWeight: 700, color: 'var(--verde)' }}>{moneyFmt(a.valor)}</span>
          </div>
        ))}
        {porAba.length === 0 && <div style={{ fontSize: 13, color: 'var(--app-text-faint)', padding: '8px 0' }}>Sem despesas</div>}
      </div>
      <div className="af-card">
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--app-text-muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Despesas por Categoria
        </div>
        {porCategoria.map((r) => (
          <div key={r.categoria} className="flex items-center justify-between" style={{
            padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: 14,
          }}>
            <span style={{ color: 'var(--ink-400)' }}>{r.categoria}</span>
            <span className="mono" style={{ fontWeight: 700, color: 'var(--verde)' }}>{moneyFmt(r.valor)}</span>
          </div>
        ))}
        {porCategoria.length === 0 && <div style={{ fontSize: 13, color: 'var(--app-text-faint)', padding: '8px 0' }}>Sem despesas</div>}
      </div>
    </div>
  )

  if (tabAbas.length <= 1) {
    return (
      <>
        <div className="grid-4 mb-6">
          <KpiCard label="Rendimentos" value={totalRendimentos} colored />
          <KpiCard label="Despesas" value={-globalDespesas} colored />
          <KpiCard label="Saldo do Mês" value={totalRendimentos - globalDespesas} colored glow />
          <KpiCard label="Patrimônio" value={totalInvestido} />
        </div>
        {breakdown}
      </>
    )
  }

  return (
    <>
      <div className="mb-6">
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          {tabAbas.map((aba) => {
            const pessoa = aba.pessoaId != null ? pessoas.find((p) => p.id === aba.pessoaId) : null
            const cor = pessoa?.cor ?? 'var(--verde)'
            const isSelected = abaId === aba.id
            return (
              <button
                key={aba.id}
                onClick={() => setAbaId(aba.id)}
                style={{
                  padding: '6px 18px',
                  borderRadius: 20,
                  border: `1px solid ${isSelected ? cor : 'rgba(255,255,255,0.12)'}`,
                  background: isSelected ? `${cor}22` : 'transparent',
                  color: isSelected ? cor : 'var(--ink-400)',
                  fontSize: 13,
                  fontWeight: isSelected ? 700 : 400,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {aba.nome}
              </button>
            )
          })}
        </div>

        <div className="grid-4">
          <KpiCard label="Rendimentos" value={totalRendimentos} colored />
          <KpiCard label="Despesas" value={-totalDespesas} colored />
          <KpiCard label="Saldo do Mês" value={saldo} colored glow />
          <KpiCard label="Patrimônio" value={totalInvestido} />
        </div>
      </div>

      {breakdown}
    </>
  )
}
