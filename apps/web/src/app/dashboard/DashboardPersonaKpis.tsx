'use client'

import { useState, useEffect, useMemo } from 'react'
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts'
import { TrendingUp, TrendingDown, Landmark, type LucideIcon } from 'lucide-react'
import { apiFetch } from '@/shared/lib/api'
import { usePersona } from '@/shared/context/PersonaContext'
import { CartaoWidget } from './CartaoWidget'
import { DashboardCharts } from './DashboardCharts'

interface Pessoa { id: number; nome: string; cor: string; ativo: boolean; familiar: boolean; padrao?: boolean }
interface Aba { id: number; nome: string; cor: string; pessoaId: number | null }
interface SplitInfo { pessoaId: number; ratio: number; valorCalculado: number }
interface Despesa { id: number; abaId: number; valor: number; categoria: string; tipo: string; splits?: SplitInfo[] }
interface Rendimento { id: number; pessoaId: number | null; valor: number }
interface Posicao { id: number; pessoaId: number | null; categoria: string; saldo_atual: number }
interface EvolucaoPat { mesRef: string; saldo: number }

interface Props {
  mesRef: string
  globalDespesas: number
  totalRendimentos: number
  totalInvestido: number
  globalPorAba: { aba: string; valor: number; cor?: string }[]
  globalPorCategoria: { categoria: string; valor: number }[]
  mes12Refs: string[]
  mes12Labels: string[]
}

const CAT_COLORS: Record<string, string> = {
  'Alimentação': '#FF4B6E', 'Assinaturas': '#B07AFF', 'Compras': '#FF8A5C',
  'Educação': '#5EEAD4', 'Lazer': '#F4A261', 'Outros': '#5A6273',
  'Transporte': '#6FA9D6', 'Saúde': '#34D399', 'Casa': '#60A5FA',
  'Vestuário': '#F472B6', 'Pets': '#FBBF24', 'Viagem': '#A78BFA',
  'Presente': '#FB7185', 'Cartão': '#94A3B8',
}

const ABA_PALETTE = ['#12A09E', '#5B996A', '#7B6EF5', '#F2811D', '#D93232', '#E3F272', '#6FA9D6', '#B07AFF']

function fmt(v: number) {
  return Math.abs(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function deltaPct(arr: number[], positive?: boolean): { label: string; pos: boolean } {
  if (arr.length < 2) return { label: '—', pos: true }
  const prev = arr[arr.length - 2], curr = arr[arr.length - 1]
  if (prev === 0) return { label: '—', pos: true }
  const pct = ((curr - prev) / Math.abs(prev)) * 100
  const pos = positive !== undefined ? positive : pct >= 0
  return { label: `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`, pos }
}

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const [hovered, setHovered] = useState<number | null>(null)
  if (data.length < 2) return <div style={{ width: 130, height: 46, flexShrink: 0 }} />
  const w = 130, h = 46
  const min = Math.min(...data), max = Math.max(...data)
  const range = max - min || 1
  const points = data.map((v, i) => ({
    x: (i / (data.length - 1)) * w,
    y: h - 4 - ((v - min) / range) * (h - 12),
  }))
  const polylinePoints = points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  return (
    <div style={{ position: 'relative', width: w, height: h, flexShrink: 0 }}>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: 'block' }}>
        <polyline points={polylinePoints} fill="none" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={8} fill="transparent" style={{ cursor: 'crosshair' }}
            onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)} />
        ))}
      </svg>
      {hovered !== null && (
        <div style={{
          position: 'absolute',
          top: Math.max(0, points[hovered].y - 30),
          left: Math.min(Math.max(0, points[hovered].x - 36), w - 84),
          background: '#1A1F1D', border: '1px solid var(--line)', borderRadius: 6,
          padding: '4px 8px', fontSize: 11, color: '#fff',
          whiteSpace: 'nowrap' as const, pointerEvents: 'none' as const,
          zIndex: 20, fontVariantNumeric: 'tabular-nums' as const, fontWeight: 600,
        }}>
          {data[hovered].toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
        </div>
      )}
    </div>
  )
}

function DeltaPill({ label, pos }: { label: string; pos: boolean }) {
  return (
    <span style={{
      padding: '3px 9px', borderRadius: 999,
      background: pos ? 'rgba(18,160,158,0.18)' : 'rgba(217,50,50,0.16)',
      border: `1px solid ${pos ? 'rgba(18,160,158,0.35)' : 'rgba(217,50,50,0.32)'}`,
      color: pos ? '#12A09E' : '#E66666',
      fontSize: 11, fontWeight: 600, fontVariantNumeric: 'tabular-nums',
      whiteSpace: 'nowrap' as const,
    }}>
      {pos ? '↑' : '↓'} {label}
    </span>
  )
}

function HeroTip({ active, payload }: { active?: boolean; payload?: Array<{ payload: { mes: string; saldo: number } }> }) {
  if (!active || !payload?.length) return null
  const p = payload[0].payload
  return (
    <div style={{
      background: '#1A1F1D', border: '1px solid var(--line)', borderRadius: 6,
      padding: '4px 9px', fontSize: 11, color: '#fff',
      fontVariantNumeric: 'tabular-nums' as const, fontWeight: 600, whiteSpace: 'nowrap' as const,
    }}>
      <span style={{ color: 'rgba(255,255,255,0.5)', marginRight: 6 }}>{p.mes}</span>
      {p.saldo < 0 ? '−' : ''}{fmt(p.saldo)}
    </div>
  )
}

function TrendRow({ label, value, maxVal, deltaLabel, deltaPos, color }: {
  label: string; value: number; maxVal: number; deltaLabel: string; deltaPos: boolean; color: string;
}) {
  const fill = maxVal > 0 ? Math.min((value / maxVal) * 100, 100) : 0
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
        <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.70)' }}>{label}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: '#fff', fontVariantNumeric: 'tabular-nums' as const }}>{fmt(value)}</span>
          {deltaLabel === '—'
            ? <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.30)' }}>—</span>
            : <DeltaPill label={deltaLabel} pos={deltaPos} />}
        </div>
      </div>
      <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 999 }}>
        <div style={{ height: '100%', width: `${fill}%`, background: color, borderRadius: 999 }} />
      </div>
    </div>
  )
}

function MiniKpi({ label, value, color, sub, data12m, deltaLabel, deltaPos, Icon }: {
  label: string; value: number; color: string; sub: string;
  data12m: number[]; deltaLabel: string; deltaPos: boolean;
  Icon?: LucideIcon;
}) {
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--line)', borderLeft: `3px solid ${color}`,
      borderRadius: 16, padding: '18px',
      display: 'grid', gridTemplateColumns: '1fr 130px', gap: 14, alignItems: 'center', flex: 1,
    }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' as const }}>
          {Icon && (
            <div style={{
              width: 34, height: 34, borderRadius: 8, background: color,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <Icon size={17} color="#fff" />
            </div>
          )}
          <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.10em', color: '#fff' }}>{label}</span>
          <DeltaPill label={deltaLabel} pos={deltaPos} />
        </div>
        <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', color, fontVariantNumeric: 'tabular-nums' as const, lineHeight: 1, marginBottom: 8 }}>
          {value < 0 ? '−' : ''}{fmt(value)}
        </div>
        <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.40)' }}>{sub}</div>
      </div>
      <Sparkline data={data12m.length > 1 ? data12m : [0, 0]} color={color} />
    </div>
  )
}

function BarRow({ name, value, maxVal, total, color }: { name: string; value: number; maxVal: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0
  const fill = maxVal > 0 ? Math.min((value / maxVal) * 100, 100) : 0
  return (
    <div style={{ marginBottom: 14, opacity: value === 0 ? 0.35 : 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
        <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.70)' }}>{name}</span>
        <div>
          <span style={{ fontSize: 13, fontWeight: 500, color: '#fff', fontVariantNumeric: 'tabular-nums' as const }}>{fmt(value)}</span>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.40)', marginLeft: 6 }}>{pct}%</span>
        </div>
      </div>
      <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 999 }}>
        <div style={{ height: '100%', width: `${fill}%`, background: color, borderRadius: 999 }} />
      </div>
    </div>
  )
}

function PanelHead({ title, right }: { title: string; right: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
      <span style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase' as const, letterSpacing: '0.10em', color: 'rgba(255,255,255,0.40)' }}>{title}</span>
      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.40)' }}>{right}</span>
    </div>
  )
}

export function DashboardPersonaKpis({
  mesRef, globalDespesas, totalRendimentos,
  globalPorAba, globalPorCategoria,
  mes12Refs, mes12Labels,
}: Props) {
  const { setPessoaId } = usePersona()
  const [pessoas, setPessoas] = useState<Pessoa[]>([])
  const [abas, setAbas] = useState<Aba[]>([])
  const [despByMes, setDespByMes] = useState<Record<string, Despesa[]>>({})
  const [rendByMes, setRendByMes] = useState<Record<string, Rendimento[]>>({})
  const [posicoes, setPosicoes] = useState<Posicao[]>([])
  const [evolucaoPat, setEvolucaoPat] = useState<EvolucaoPat[]>([])
  const [abaId, setAbaId] = useState<number | null>(null)

  // Despesas/rendimentos crus dos 12 meses — buscados 1x, refiltrados por pessoa via useMemo
  const despesas = despByMes[mesRef] ?? []
  const rendimentos = rendByMes[mesRef] ?? []

  const tabAbas = useMemo(() => {
    const pessoais = abas.filter((a) => a.pessoaId != null)
    const familiar = abas.find((a) => a.pessoaId == null)
    const sorted = [...pessoais].sort((a, b) => {
      const pA = pessoas.find((p) => p.id === a.pessoaId)
      const pB = pessoas.find((p) => p.id === b.pessoaId)
      if (pA?.padrao && !pB?.padrao) return -1
      if (!pA?.padrao && pB?.padrao) return 1
      return a.nome.localeCompare(b.nome, 'pt-BR')
    })
    return familiar ? [...sorted, familiar] : sorted
  }, [abas, pessoas])

  const familiarAbaId = useMemo(() => abas.find((a) => a.pessoaId == null)?.id ?? null, [abas])
  const abaMap = useMemo(() => new Map(abas.map((a) => [a.id, a])), [abas])
  const pessoaSelecionada = useMemo(() => {
    const aba = abas.find((a) => a.id === abaId)
    return aba?.pessoaId != null ? pessoas.find((p) => p.id === aba.pessoaId) ?? null : null
  }, [abaId, abas, pessoas])

  useEffect(() => {
    Promise.all([apiFetch<Pessoa[]>('/api/pessoas'), apiFetch<Aba[]>('/api/abas')])
      .then(([p, a]) => { setPessoas(p); setAbas(a) })
      .catch(() => {})
    apiFetch<Posicao[]>('/api/investimentos/posicoes?ativo=true').then(setPosicoes).catch(() => {})
  }, [])

  // Evolução patrimonial (sparkline do Patrimônio) — refaz ao trocar de pessoa
  useEffect(() => {
    const q = pessoaSelecionada ? `&pessoaId=${pessoaSelecionada.id}` : ''
    apiFetch<EvolucaoPat[]>(`/api/investimentos/evolucao?meses=12${q}`)
      .then(setEvolucaoPat)
      .catch(() => setEvolucaoPat([]))
  }, [pessoaSelecionada])

  const mes12Key = mes12Refs.join(',')
  useEffect(() => {
    let cancelled = false
    Promise.all(
      mes12Refs.map(async (m) => {
        const [d, r] = await Promise.all([
          apiFetch<Despesa[]>(`/api/despesas?mesRef=${m}`).catch(() => [] as Despesa[]),
          apiFetch<Rendimento[]>(`/api/rendimentos?mesRef=${m}`).catch(() => [] as Rendimento[]),
        ])
        return [m, d, r] as const
      }),
    ).then((entries) => {
      if (cancelled) return
      const dm: Record<string, Despesa[]> = {}
      const rm: Record<string, Rendimento[]> = {}
      for (const [m, d, r] of entries) { dm[m] = d; rm[m] = r }
      setDespByMes(dm)
      setRendByMes(rm)
    })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mes12Key])

  useEffect(() => {
    if (abaId == null && tabAbas.length > 0) {
      const first = tabAbas[0]
      setAbaId(first.id)
      setPessoaId(first.pessoaId ?? null)
    }
  }, [tabAbas, abaId, setPessoaId])

  function selectTab(aba: Aba) {
    setAbaId(aba.id)
    setPessoaId(aba.pessoaId ?? null)
  }

  const grupoAbaIds = useMemo(() => new Set(abas.filter((a) => a.pessoaId == null).map((a) => a.id)), [abas])

  const efetivo = useMemo(() => (d: Despesa): number => {
    if (pessoaSelecionada && d.splits) {
      const meu = d.splits.find((s) => s.pessoaId === pessoaSelecionada.id)
      if (meu) return d.valor * meu.ratio
    }
    return d.valor
  }, [pessoaSelecionada])

  // Filtros reaproveitáveis (mês corrente + série de 12 meses) — refletem a pessoa selecionada
  const filterDespesasFn = useMemo(() => (arr: Despesa[]): Despesa[] => {
    if (abaId == null) return arr
    // Aba grupo: todas com splits
    if (grupoAbaIds.has(abaId)) return arr.filter((d) => d.splits?.length)
    // Aba pessoal: próprias + outras abas onde tem split
    return arr.filter((d) => {
      if (d.abaId === abaId) return true
      if (pessoaSelecionada && d.splits?.some((s) => s.pessoaId === pessoaSelecionada.id)) return true
      return false
    })
  }, [abaId, grupoAbaIds, pessoaSelecionada])

  const filterRendFn = useMemo(() => (arr: Rendimento[]): Rendimento[] => {
    if (pessoaSelecionada) return arr.filter((r) => r.pessoaId === pessoaSelecionada.id)
    return arr.filter((r) => r.pessoaId === null)
  }, [pessoaSelecionada])

  const filtered = useMemo(
    () => (abaId == null ? null : filterDespesasFn(despesas)),
    [abaId, filterDespesasFn, despesas],
  )

  const filteredRendimentos = useMemo(
    () => (abaId == null ? null : filterRendFn(rendimentos)),
    [abaId, filterRendFn, rendimentos],
  )

  // Série de 12 meses, já filtrada pela pessoa selecionada
  const series12 = useMemo(
    () => mes12Refs.map((m) => {
      const desp = filterDespesasFn(despByMes[m] ?? [])
      const rend = filterRendFn(rendByMes[m] ?? [])
      return {
        mes: m,
        despesas: desp.reduce((s, d) => s + efetivo(d), 0),
        rendimentos: rend.reduce((s, r) => s + r.valor, 0),
      }
    }),
    [mes12Refs, despByMes, rendByMes, filterDespesasFn, filterRendFn, efetivo],
  )

  const rendimentos12m = useMemo(() => series12.map((s) => s.rendimentos), [series12])
  const despesas12m = useMemo(() => series12.map((s) => s.despesas), [series12])
  const saldo12m = useMemo(() => series12.map((s) => s.rendimentos - s.despesas), [series12])

  const totalDespesas = filtered != null ? filtered.reduce((s, d) => s + efetivo(d), 0) : globalDespesas
  const totalRend = filteredRendimentos != null ? filteredRendimentos.reduce((s, r) => s + r.valor, 0) : totalRendimentos
  const saldo = totalRend - totalDespesas

  const porAba = useMemo(() => {
    if (filtered == null) return globalPorAba
    const map = new Map<string, { valor: number; cor?: string }>()
    for (const d of filtered) {
      const aba = abaMap.get(d.abaId)
      const nome = aba?.nome ?? 'Desconhecida'
      const existing = map.get(nome) ?? { valor: 0, cor: aba?.cor }
      map.set(nome, { valor: existing.valor + efetivo(d), cor: aba?.cor })
    }
    return Array.from(map.entries())
      .map(([aba, { valor, cor }]) => ({ aba, valor, cor }))
      .sort((a, b) => b.valor - a.valor)
  }, [filtered, abaMap, efetivo, globalPorAba])

  const porCategoria = useMemo(() => {
    if (filtered == null) return globalPorCategoria
    const map = new Map<string, number>()
    for (const d of filtered) map.set(d.categoria, (map.get(d.categoria) ?? 0) + efetivo(d))
    return Array.from(map.entries()).map(([categoria, valor]) => ({ categoria, valor })).sort((a, b) => b.valor - a.valor)
  }, [filtered, efetivo, globalPorCategoria])

  // Patrimônio (net worth) da pessoa selecionada — net worth real + nº de classes
  const isFamiliarTab = abaId != null && grupoAbaIds.has(abaId)
  const patrimonioPosicoes = useMemo(() => {
    if (pessoaSelecionada) return posicoes.filter((p) => p.pessoaId === pessoaSelecionada.id)
    if (isFamiliarTab) return posicoes.filter((p) => p.pessoaId === null)
    return posicoes
  }, [posicoes, pessoaSelecionada, isFamiliarTab])
  const patrimonioValor = patrimonioPosicoes.reduce((s, p) => s + p.saldo_atual, 0)
  const patrimonioClasses = useMemo(() => new Set(patrimonioPosicoes.map((p) => p.categoria)).size, [patrimonioPosicoes])
  const patrimonioSerie = useMemo(() => evolucaoPat.map((e) => e.saldo), [evolucaoPat])
  const patrimonioDelta = deltaPct(patrimonioSerie)

  // Tendência de gastos: soma de despesa em janelas 3/6/12m + % vs janela anterior de mesmo tamanho.
  // despesas12m: 12 valores, do mais antigo (índice 0) ao mês corrente (índice 11).
  const tendencia = useMemo(() => {
    const windowSum = (n: number, offset: number): number | null => {
      const end = despesas12m.length - offset
      const start = end - n
      if (start < 0) return null
      return despesas12m.slice(start, end).reduce((a, b) => a + b, 0)
    }
    const make = (n: number) => {
      const cur = windowSum(n, 0)
      const prev = windowSum(n, n)
      let deltaLabel = '—'
      let deltaPos = true
      if (cur != null && prev != null && prev > 0) {
        const pct = ((cur - prev) / prev) * 100
        deltaLabel = `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`
        deltaPos = cur <= prev // gastou menos = positivo (verde)
      }
      return { valor: cur ?? 0, deltaLabel, deltaPos }
    }
    return [
      { label: 'Últimos 3 meses', ...make(3) },
      { label: 'Últimos 6 meses', ...make(6) },
      { label: 'Últimos 12 meses', ...make(12) },
    ]
  }, [despesas12m])
  const tendenciaMax = Math.max(...tendencia.map((t) => t.valor), 0)

  // Derived
  const saldoFormatted = Math.abs(saldo).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const commaIdx = saldoFormatted.lastIndexOf(',')
  const heroInt = saldoFormatted.slice(0, commaIdx)
  const heroDec = saldoFormatted.slice(commaIdx)

  const heroChartData = saldo12m.map((s, i) => ({ mes: mes12Labels[i] ?? '', saldo: s }))
  const rendFontes = filteredRendimentos != null ? filteredRendimentos.length : rendimentos.length
  const despCats = porCategoria.filter((c) => c.valor > 0).length

  const rendDelta = deltaPct(rendimentos12m, true)
  const despDelta = deltaPct(despesas12m, false)
  const saldoDelta = deltaPct(saldo12m, saldo >= 0)

  const mesLabel = mes12Labels[mes12Labels.length - 1] ?? mesRef

  return (
    <>
      {/* Persona tabs */}
      {tabAbas.length > 1 && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          {tabAbas.map((aba) => {
            const isSelected = abaId === aba.id
            return (
              <button
                key={aba.id}
                onClick={() => selectTab(aba)}
                style={{
                  padding: '7px 16px', borderRadius: 999,
                  border: `1px solid ${isSelected ? 'rgba(255,255,255,0.12)' : 'transparent'}`,
                  background: isSelected ? 'rgba(255,255,255,0.06)' : 'transparent',
                  color: isSelected ? '#fff' : 'rgba(255,255,255,0.40)',
                  fontSize: 13, fontWeight: isSelected ? 600 : 400,
                  cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'inherit',
                }}
              >
                {aba.nome}
              </button>
            )
          })}
        </div>
      )}

      {/* Top grid: hero 1.6fr + mini-stack 1fr */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 16, marginBottom: 16 }}>

        {/* Hero card — Saldo do Mês */}
        <div style={{
          background: 'var(--section-hero-bg, #0B2926)',
          border: '1px solid var(--section-hero-border, rgba(18,160,158,0.28))',
          borderRadius: 16, padding: '24px', overflow: 'hidden', position: 'relative',
        }}>
          {/* top row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.10em', color: 'rgba(255,255,255,0.55)' }}>
              Saldo do mês · {mesRef}
            </span>
            <DeltaPill label={saldoDelta.label} pos={saldoDelta.pos} />
          </div>

          {/* big number */}
          <div style={{ marginTop: 18, display: 'flex', alignItems: 'baseline', gap: 6 }}>
            {saldo < 0 && <span style={{ fontSize: 22, fontWeight: 500, color: '#f7cd23' }}>−</span>}
            <span style={{ fontSize: 22, fontWeight: 500, color: saldo < 0 ? '#f7cd23' : 'rgba(255,255,255,0.55)', fontVariantNumeric: 'tabular-nums' }}>R$</span>
            <span style={{ fontSize: 64, fontWeight: 700, color: saldo < 0 ? '#f7cd23' : '#fff', lineHeight: 0.95, letterSpacing: '-0.035em', fontVariantNumeric: 'tabular-nums' }}>
              {heroInt}
            </span>
            <span style={{ fontSize: 24, fontWeight: 500, color: saldo < 0 ? '#f7cd23' : 'rgba(255,255,255,0.55)', letterSpacing: '-0.01em', fontVariantNumeric: 'tabular-nums' }}>
              {heroDec}
            </span>
          </div>

          {/* embedded 12-month chart */}
          {heroChartData.length > 1 && (
            <div style={{ marginTop: 22 }}>
              <ResponsiveContainer width="100%" height={140}>
                <AreaChart data={heroChartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="heroAreaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#12A09E" stopOpacity={0.45} />
                      <stop offset="100%" stopColor="#12A09E" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Tooltip
                    cursor={{ stroke: 'rgba(255,255,255,0.22)', strokeWidth: 1 }}
                    content={<HeroTip />}
                    isAnimationActive={false}
                  />
                  <Area
                    type="monotone" dataKey="saldo" stroke="#12A09E" strokeWidth={1.8}
                    fill="url(#heroAreaGrad)" dot={false} isAnimationActive={false}
                    activeDot={{ r: 3.5, fill: '#12A09E', stroke: '#0B2926', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
              {/* month labels */}
              <div style={{ display: 'grid', gridTemplateColumns: `repeat(${mes12Labels.length}, 1fr)`, marginTop: 8 }}>
                {mes12Labels.map((m, i) => (
                  <span key={i} style={{ fontSize: 10, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(255,255,255,0.30)', textAlign: 'center' }}>
                    {m}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Mini KPI stack */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <MiniKpi
            label="Rendimentos"
            Icon={TrendingUp}
            value={totalRend}
            color="#5B996A"
            sub={`${rendFontes} fonte${rendFontes !== 1 ? 's' : ''}`}
            data12m={rendimentos12m}
            deltaLabel={rendDelta.label}
            deltaPos={rendDelta.pos}
          />
          <MiniKpi
            label="Despesas"
            Icon={TrendingDown}
            value={totalDespesas}
            color="#D93232"
            sub={`${despCats} categori${despCats !== 1 ? 'as' : 'a'}`}
            data12m={despesas12m}
            deltaLabel={despDelta.label}
            deltaPos={despDelta.pos}
          />
          <MiniKpi
            label="Patrimônio"
            Icon={Landmark}
            value={patrimonioValor}
            color="#7B6EF5"
            sub={`${patrimonioClasses} classe${patrimonioClasses !== 1 ? 's' : ''}`}
            data12m={patrimonioSerie}
            deltaLabel={patrimonioDelta.label}
            deltaPos={patrimonioDelta.pos}
          />
        </div>
      </div>

      {/* 3-up breakdown row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>

        {/* Slot contextual: Familiar mostra "Por aba" (distribuição entre pessoas);
            abas pessoais mostram "Tendência" de gastos (3/6/12m) */}
        {isFamiliarTab ? (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 16, padding: '22px' }}>
            <PanelHead title="Por aba" right={<>Total <b style={{ color: '#fff' }}>{fmt(totalDespesas)}</b></>} />
            {porAba.length === 0
              ? <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.25)' }}>Sem despesas</div>
              : porAba.slice(0, 5).map(({ aba, valor, cor }, i) => (
                <BarRow
                  key={aba}
                  name={aba}
                  value={valor}
                  maxVal={Math.max(...porAba.map((a) => a.valor))}
                  total={totalDespesas}
                  color={cor ?? ABA_PALETTE[i % ABA_PALETTE.length]}
                />
              ))
            }
          </div>
        ) : (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 16, padding: '22px' }}>
            <PanelHead title="Tendência de gastos" right="vs. período anterior" />
            {tendenciaMax === 0
              ? <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.25)' }}>Sem despesas</div>
              : tendencia.map((t) => (
                <TrendRow
                  key={t.label}
                  label={t.label}
                  value={t.valor}
                  maxVal={tendenciaMax}
                  deltaLabel={t.deltaLabel}
                  deltaPos={t.deltaPos}
                  color="#D93232"
                />
              ))
            }
          </div>
        )}

        {/* Por Categoria */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 16, padding: '22px' }}>
          <PanelHead title="Por categoria" right={`${despCats} categorias`} />
          {porCategoria.length === 0
            ? <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.25)' }}>Sem despesas</div>
            : porCategoria.slice(0, 5).map(({ categoria, valor }) => (
              <BarRow
                key={categoria}
                name={categoria}
                value={valor}
                maxVal={Math.max(...porCategoria.map((c) => c.valor))}
                total={totalDespesas}
                color={CAT_COLORS[categoria] ?? '#5A6273'}
              />
            ))
          }
        </div>

        {/* Cartão em Uso */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 16, padding: '22px', overflow: 'hidden' }}>
          <PanelHead title="Cartão em uso" right={`Ciclo · ${mesLabel}`} />
          <CartaoWidget panelMode />
        </div>
      </div>

      <DashboardCharts evolucao12meses={series12} />
    </>
  )
}
