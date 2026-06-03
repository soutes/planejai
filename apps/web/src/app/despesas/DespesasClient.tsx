'use client'

import { useState, useEffect, useMemo } from 'react'
import { Plus, Trash2, CreditCard, Repeat, ReceiptText, Receipt, BarChart2, Calculator } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { FormField } from '@/components/ui/FormField'
import { EmptyState } from '@/components/ui/EmptyState'
import { MoneyValue, formatMoney } from '@/components/ui/MoneyValue'
import { apiFetch } from '@/shared/lib/api'
import { useMesRef } from '@/shared/context/MesRefContext'
import { formatDataBR, formatMesRefNum } from '@/shared/lib/format'
import { useCategorias } from '@/shared/hooks/useCategorias'
import type { DespesaMock, DespesaSplit } from '@/types/despesas'

interface Pessoa { id: number; nome: string; cor: string; ativo: boolean; familiar: boolean; padrao?: boolean }
interface Aba { id: number; nome: string; cor: string; pessoaId: number | null }

interface DespesaFormSplit {
  pessoaId: string
  percentual: string
}

interface DespesaForm {
  descricao: string
  categoria: string
  valor: string
  data: string
  notas: string
  abaId: string           // aba do pagador (pessoa)
  recorrente: boolean
  mesesRecorrencia: string
  parcelado: boolean
  totalParcelas: string
  somenteMeu: boolean
  divideComGrupo: boolean
  grupoId: string         // aba de grupo selecionada
  splits: DespesaFormSplit[]
}

export function DespesasClient() {
  const categorias = useCategorias()
  const { mesRef } = useMesRef()
  const [pessoas, setPessoas] = useState<Pessoa[]>([])
  const [abas, setAbas] = useState<Aba[]>([])
  const [abaId, setAbaId] = useState<number | null>(null)
  const [despesas, setDespesas] = useState<DespesaMock[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<DespesaMock | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<DespesaMock | null>(null)
  const [form, setForm] = useState<DespesaForm | null>(null)
  const [saving, setSaving] = useState(false)

  // Tabs derivadas: padrão primeiro, demais alfabético, Familiar por último
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

  const grupoAbaIds = useMemo(() => new Set(abas.filter((a) => a.pessoaId == null).map((a) => a.id)), [abas])
  const familiares = useMemo(() => pessoas.filter((p) => p.familiar), [pessoas])

  // Pessoa correspondente à aba selecionada (null = aba Familiar selecionada)
  const pessoaSelecionada = useMemo(() => {
    const aba = abas.find((a) => a.id === abaId)
    return aba?.pessoaId != null ? pessoas.find((p) => p.id === aba.pessoaId) ?? null : null
  }, [abaId, abas, pessoas])

  // Carrega pessoas + abas
  useEffect(() => {
    apiFetch<Pessoa[]>('/api/pessoas').then(setPessoas).catch(() => {})
    apiFetch<Aba[]>('/api/abas').then(setAbas).catch(() => {})
  }, [])

  // Define aba default quando abas carregam
  useEffect(() => {
    if (abaId == null && tabAbas.length > 0) setAbaId(tabAbas[0].id)
  }, [tabAbas, abaId])

  // Carrega despesas
  useEffect(() => {
    type ApiSplit = { pessoaId: number; ratio: number; valorCalculado: number; valorQuitado?: number }
    type ApiDespesa = Omit<DespesaMock, 'aba' | 'splits'> & { splits?: ApiSplit[] }
    apiFetch<ApiDespesa[]>(`/api/despesas?mesRef=${mesRef}`)
      .then((rows) => setDespesas(rows.map((r) => ({
        ...r,
        aba: abas.find((a) => a.id === r.abaId)?.nome ?? '',
        splits: r.splits?.length
          ? r.splits.map((s) => ({
              pessoaId: s.pessoaId,
              pessoa: pessoas.find((p) => p.id === s.pessoaId)?.nome ?? '',
              percentual: s.ratio * 100,
              valorCalculado: s.valorCalculado,
              valorQuitado: s.valorQuitado ?? 0,
            }))
          : undefined,
      }))))
      .catch(() => {})
  }, [mesRef, abas, pessoas])

  const filtered = despesas.filter((d) => {
    if (abaId == null) return false
    // Tab de grupo: mostra todas as despesas com splits
    if (grupoAbaIds.has(abaId)) return !!(d.splits?.length)
    // Tab pessoal: despesas próprias + despesas de outras abas onde esta pessoa tem split
    if (d.abaId === abaId) return true
    if (pessoaSelecionada && d.splits?.some((s) => s.pessoaId === pessoaSelecionada.id)) return true
    return false
  })

  function efetivo(d: DespesaMock): number {
    if (pessoaSelecionada && d.splits?.length) {
      const meu = d.splits.find((s) => s.pessoaId === pessoaSelecionada.id)
      if (meu) return d.valor * (meu.percentual / 100)
    }
    return d.valor
  }

  // Badge de quitação (acerto): ✓ = totalmente quitado, ½ = parcial. null = nada a exibir.
  function quitacaoBadge(d: DespesaMock): { symbol: string; color: string; title: string } | null {
    if (!d.splits?.length) return null
    const relevantes = pessoaSelecionada && d.abaId !== abaId
      ? d.splits.filter((s) => s.pessoaId === pessoaSelecionada.id)
      : d.splits
    const totalCalc = relevantes.reduce((a, s) => a + (s.valorCalculado ?? 0), 0)
    const totalQuit = relevantes.reduce((a, s) => a + (s.valorQuitado ?? 0), 0)
    if (totalCalc <= 0 || totalQuit <= 0) return null
    if (totalQuit >= totalCalc - 0.005) return { symbol: '✓', color: '#10F5A3', title: 'Acerto quitado' }
    return { symbol: '½', color: '#F2C94C', title: 'Acerto parcial' }
  }

  const total = filtered.reduce((s, d) => s + efetivo(d), 0)

  const catAgg: Record<string, number> = {}
  for (const d of filtered) catAgg[d.categoria] = (catAgg[d.categoria] ?? 0) + efetivo(d)
  const porCategoriaDesp = Object.entries(catAgg).sort(([, a], [, b]) => b - a).map(([cat, val]) => ({ cat, val }))
  const topCatDesp = porCategoriaDesp[0] ?? null
  const mediaDesp = filtered.length > 0 ? total / filtered.length : 0

  const despAbs = Math.abs(total)
  const despFormatted = despAbs.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const despCommaIdx = despFormatted.lastIndexOf(',')
  const despInt = despFormatted.slice(0, despCommaIdx)
  const despDec = despFormatted.slice(despCommaIdx)

  function defaultSplits(): DespesaFormSplit[] {
    const grupo = familiares.length > 0 ? familiares : pessoas
    if (grupo.length === 0) return []
    const share = Math.floor(100 / grupo.length)
    const splits = grupo.map((p) => ({ pessoaId: String(p.id), percentual: String(share) }))
    // Ajusta sobra para somar 100
    const soma = share * grupo.length
    if (soma < 100 && splits.length > 0) {
      splits[0] = { ...splits[0], percentual: String(share + (100 - soma)) }
    }
    return splits
  }

  const pessoaAbas = useMemo(() => tabAbas.filter((a) => a.pessoaId != null), [tabAbas])
  const grupoAbas = useMemo(() => tabAbas.filter((a) => a.pessoaId == null), [tabAbas])

  function defaultPessoaAbaId(): string {
    // Prefere a aba da tab atual se for pessoal, senão a primeira pessoal
    const current = tabAbas.find((a) => a.id === abaId)
    if (current?.pessoaId != null) return String(current.id)
    return String(pessoaAbas[0]?.id ?? tabAbas[0]?.id ?? '')
  }

  function emptyForm(): DespesaForm {
    return {
      descricao: '', categoria: 'Alimentação', valor: '', data: new Date().toISOString().slice(0, 10),
      notas: '', abaId: defaultPessoaAbaId(),
      recorrente: false, mesesRecorrencia: '12',
      parcelado: false, totalParcelas: '2',
      somenteMeu: false, divideComGrupo: false,
      grupoId: String(grupoAbas[0]?.id ?? ''),
      splits: defaultSplits(),
    }
  }

  function openNew() {
    setEditTarget(null)
    setForm(emptyForm())
    setModalOpen(true)
  }

  function openEdit(d: DespesaMock) {
    if (d.tipo === 'cartao_ciclo') return
    setEditTarget(d)
    setForm({
      descricao: d.descricao,
      categoria: d.categoria,
      valor: String(d.valor),
      data: d.data ?? '',
      notas: d.notas ?? '',
      abaId: String(d.abaId),
      recorrente: d.tipo === 'fixa',
      mesesRecorrencia: String(d.totalRepeticoes ?? 12),
      parcelado: d.tipo === 'parcela',
      totalParcelas: String(d.totalParcelas ?? 2),
      somenteMeu: d.somenteMeu ?? false,
      divideComGrupo: !!(d.splits?.length) && !d.somenteMeu,
      grupoId: d.abaId !== abaId ? String(d.abaId) : String(grupoAbas[0]?.id ?? ''),
      splits: d.splits ? d.splits.map((s) => ({ pessoaId: String(s.pessoaId), percentual: String(s.percentual) })) : defaultSplits(),
    })
    setModalOpen(true)
  }

  async function handleSave() {
    if (!form) return
    setSaving(true)
    const formAbaId = parseInt(form.abaId)
    const isFamiliar = form.divideComGrupo
    const valor = parseFloat(form.valor)
    const apiSplits = isFamiliar && !form.somenteMeu
      ? form.splits.map((s) => ({
          pessoaId: parseInt(s.pessoaId),
          ratio: parseFloat(s.percentual) / 100,
          valorCalculado: valor * (parseFloat(s.percentual) / 100),
        }))
      : undefined

    const tipo = (form.recorrente ? 'fixa' : form.parcelado ? 'parcela' : 'manual') as DespesaMock['tipo']

    const body = {
      descricao: form.descricao,
      categoria: form.categoria,
      valor,
      data: form.data || null,
      notas: form.notas || null,
      abaId: formAbaId,
      mesRef: form.data ? form.data.slice(0, 7) : mesRef,
      tipo,
      recorrente: form.recorrente,
      totalRepeticoes: form.recorrente ? parseInt(form.mesesRecorrencia) : null,
      totalParcelas: form.parcelado ? parseInt(form.totalParcelas) : null,
      somenteMeu: form.somenteMeu,
      splits: apiSplits,
    }

    const localSplits: DespesaSplit[] | undefined = isFamiliar && !form.somenteMeu
      ? form.splits.map((s) => ({
          pessoaId: parseInt(s.pessoaId),
          pessoa: pessoas.find((p) => p.id === parseInt(s.pessoaId))?.nome ?? '',
          percentual: parseFloat(s.percentual),
        }))
      : undefined

    try {
      if (editTarget) {
        const updated = await apiFetch<Omit<DespesaMock, 'aba'>>(`/api/despesas/${editTarget.id}`, { method: 'PUT', body: JSON.stringify(body) })
        setDespesas((prev) => {
          // Mudou de mês → some da visão do mês atual
          if (updated.mesRef !== mesRef) return prev.filter((d) => d.id !== editTarget.id)
          return prev.map((d) => d.id === editTarget.id
            ? { ...updated, aba: abas.find((a) => a.id === updated.abaId)?.nome ?? '', splits: localSplits }
            : d)
        })
      } else {
        const created = await apiFetch<Omit<DespesaMock, 'aba'>>('/api/despesas', { method: 'POST', body: JSON.stringify(body) })
        setDespesas((prev) => [...prev, { ...created, aba: abas.find((a) => a.id === created.abaId)?.nome ?? '', splits: localSplits }])
      }
    } catch (err) {
      console.error('[save despesa]', err)
      alert(`Falha ao salvar: ${err instanceof Error ? err.message : 'erro desconhecido'}`)
      setSaving(false)
      return
    }
    setSaving(false)
    setModalOpen(false)
  }

  async function handleDelete(d: DespesaMock, serie: boolean) {
    try {
      await apiFetch(`/api/despesas/${d.id}?serie=${serie}`, { method: 'DELETE' })
      if (serie && d.origemId) {
        setDespesas((prev) => prev.filter((x) => x.origemId !== d.origemId))
      } else {
        setDespesas((prev) => prev.filter((x) => x.id !== d.id))
      }
      setDeleteTarget(null)
    } catch (err) {
      console.error('[delete despesa]', err)
      alert(`Falha ao excluir: ${err instanceof Error ? err.message : 'erro desconhecido'}`)
    }
  }

  // Validação: soma splits = 100 quando aba Familiar
  const formAbaIsGrupo = form ? form.divideComGrupo : false
  const somaSplits = form ? form.splits.reduce((a, s) => a + parseFloat(s.percentual || '0'), 0) : 0
  const saveDisabled = !form || saving || !form.descricao || !form.valor
    || (formAbaIsGrupo && !form.somenteMeu && Math.abs(somaSplits - 100) > 0.01)

  return (
    <>
      {/* Controls */}
      <div className="flex items-center justify-between mb-4">
        <div style={{ display: 'flex', gap: 4 }}>
          {tabAbas.map((a) => (
            <button
              key={a.id}
              className={`tab-item${abaId === a.id ? ' tab-item--active' : ''}`}
              onClick={() => setAbaId(a.id)}
            >{a.nome}</button>
          ))}
        </div>
        <Button Icon={Plus} onClick={openNew}>Nova despesa</Button>
      </div>

      {/* Hero + 3 mini KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 16, marginBottom: 20 }}>

        {/* Hero */}
        <div style={{
          background: 'var(--section-hero-bg, #2D0A0A)',
          border: '1px solid var(--section-hero-border, rgba(217,50,50,0.28))',
          borderRadius: 16, padding: '28px', overflow: 'hidden',
        }}>
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.10em', color: 'var(--section-accent, #D93232)', marginBottom: 22 }}>
            Total do período · {formatMesRefNum(mesRef)}
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 14 }}>
            <span style={{ fontSize: 22, fontWeight: 500, color: '#fff' }}>R$</span>
            <span style={{ fontSize: 64, fontWeight: 700, color: '#fff', lineHeight: 0.95, letterSpacing: '-0.035em', fontVariantNumeric: 'tabular-nums' as const }}>
              {despInt}
            </span>
            <span style={{ fontSize: 24, fontWeight: 500, color: '#fff', fontVariantNumeric: 'tabular-nums' as const }}>
              {despDec}
            </span>
          </div>
          <div style={{ fontSize: 13, color: '#fff' }}>
            {filtered.length} lançamento{filtered.length !== 1 ? 's' : ''} no período
          </div>
        </div>

        {/* Mini stack */}
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 16 }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderLeft: '3px solid var(--section-accent, #D93232)', borderRadius: 16, padding: '20px', flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: 8, background: 'var(--section-accent, #D93232)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Receipt size={17} color="#fff" />
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.10em', color: '#fff' }}>Lançamentos</span>
            </div>
            <div style={{ fontSize: 40, fontWeight: 700, color: '#fff', lineHeight: 1, letterSpacing: '-0.035em', marginBottom: 6 }}>
              {filtered.length}
            </div>
            <div style={{ fontSize: 12, color: '#fff' }}>registros em {formatMesRefNum(mesRef)}</div>
          </div>

          <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderLeft: '3px solid var(--section-accent, #D93232)', borderRadius: 16, padding: '20px', flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: 8, background: 'var(--section-accent, #D93232)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <BarChart2 size={17} color="#fff" />
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.10em', color: '#fff' }}>Maior categoria</span>
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--section-accent, #D93232)', letterSpacing: '-0.02em', marginBottom: 6, fontVariantNumeric: 'tabular-nums' as const }}>
              {topCatDesp ? formatMoney(topCatDesp.val) : '—'}
            </div>
            <div style={{ fontSize: 12, color: '#fff' }}>{topCatDesp ? topCatDesp.cat : 'Sem dados'}</div>
          </div>

          <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderLeft: '3px solid var(--section-accent, #D93232)', borderRadius: 16, padding: '20px', flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: 8, background: 'var(--section-accent, #D93232)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Calculator size={17} color="#fff" />
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.10em', color: '#fff' }}>Média/lançamento</span>
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em', marginBottom: 6, fontVariantNumeric: 'tabular-nums' as const }}>
              {mediaDesp > 0 ? formatMoney(mediaDesp) : '—'}
            </div>
            <div style={{ fontSize: 12, color: '#fff' }}>por lançamento</div>
          </div>
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="af-card" style={{ padding: 0 }}>
          <EmptyState
            icon={ReceiptText}
            title="Sem despesas neste mês"
            subtitle="Nenhuma despesa registrada para o período selecionado."
            ctaLabel="Adicionar despesa"
            ctaOnClick={openNew}
          />
        </div>
      ) : (
      <div className="af-card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="af-table">
          <thead>
            <tr>
              <th>Data</th>
              <th>Descrição</th>
              <th>Categoria</th>
              <th>Responsável</th>
              <th style={{ textAlign: 'right' }}>Valor</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((d) => (
              <tr key={d.id} style={{ cursor: d.tipo !== 'cartao_ciclo' ? 'pointer' : 'default' }}
                onClick={() => openEdit(d)}>
                <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{formatDataBR(d.data)}</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {d.tipo === 'parcela' && <CreditCard size={12} style={{ color: 'var(--app-lime)', flexShrink: 0 }} />}
                    {d.tipo === 'fixa' && <Repeat size={12} style={{ color: 'var(--app-purple)', flexShrink: 0 }} />}
                    {(d.tipo === 'cartao_ciclo' || d.tipo === 'cartao') && <CreditCard size={12} style={{ color: 'var(--app-blue)', flexShrink: 0 }} />}
                    <span>{d.descricao}</span>
                    {d.parcelaNum && d.totalParcelas && (
                      <span style={{ fontSize: 10, color: 'var(--app-text-faint)' }}>
                        {d.parcelaNum}/{d.totalParcelas}
                      </span>
                    )}
                  </div>
                </td>
                <td>
                  <span className="chip">{d.categoria}</span>
                </td>
                <td style={{ color: 'var(--app-text-muted)', fontSize: 12 }}>{d.aba}</td>
                <td style={{ textAlign: 'right' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      {(() => {
                        const b = quitacaoBadge(d)
                        return b ? (
                          <span
                            title={b.title}
                            style={{
                              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                              width: 16, height: 16, borderRadius: '50%', fontSize: 10, fontWeight: 800,
                              color: '#0A0F0D', background: b.color, flexShrink: 0,
                            }}
                          >{b.symbol}</span>
                        ) : null
                      })()}
                      <span className="mono" style={{ fontWeight: 700, color: 'var(--app-danger)' }}>
                        {formatMoney(efetivo(d))}
                      </span>
                    </span>
                    {pessoaSelecionada && d.splits?.length && d.splits.some((s) => s.pessoaId === pessoaSelecionada.id) && (
                      <span style={{ fontSize: 10, color: 'var(--app-text-faint)' }}>
                        {d.splits.find((s) => s.pessoaId === pessoaSelecionada.id)?.percentual ?? 0}% de {formatMoney(d.valor)}
                      </span>
                    )}
                  </div>
                </td>
                <td onClick={(e) => e.stopPropagation()}>
                  {d.tipo !== 'cartao_ciclo' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setDeleteTarget(d)
                      }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--app-text-faint)', padding: 4 }}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      )}

      {/* Add/Edit Modal */}
      <Modal open={modalOpen && form !== null} onClose={() => setModalOpen(false)} title={editTarget ? 'Editar despesa' : 'Nova despesa'}>
        {form && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Seletor de pagador (somente pessoas) */}
          {pessoaAbas.length > 1 && (
            <div>
              <div className="t-label" style={{ marginBottom: 8 }}>Pago por:</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {pessoaAbas.map((a) => {
                  const selected = form.abaId === String(a.id)
                  const cor = a.cor || '#10F5A3'
                  return (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => setForm({ ...form, abaId: String(a.id) })}
                      style={{
                        padding: '6px 14px', borderRadius: 20,
                        border: `1.5px solid ${selected ? cor : 'var(--border)'}`,
                        background: selected ? `${cor}22` : 'transparent',
                        color: selected ? cor : 'var(--app-text-2)',
                        cursor: 'pointer', fontSize: 13,
                        fontWeight: selected ? 700 : 400,
                      }}
                    >
                      {a.nome}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          <FormField label="Descrição" required>
            <input className="af-input" value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} placeholder="Ex: Supermercado" />
          </FormField>
          <div className="form-grid-2">
            <FormField label="Categoria" required>
              <select className="af-select" value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })}>
                {categorias.map((c) => <option key={c}>{c}</option>)}
              </select>
            </FormField>
            <FormField label="Data" required>
              <input className="af-input" type="date" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} />
            </FormField>
          </div>
          <FormField label="Valor (R$)" required>
            <input className="af-input mono" type="number" step="0.01" min="0" value={form.valor} onChange={(e) => setForm({ ...form, valor: e.target.value })} placeholder="0,00" />
          </FormField>

          {/* Divisão */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: 'var(--app-text-2)' }}>
              <input
                type="checkbox"
                checked={form.somenteMeu}
                onChange={(e) => setForm({ ...form, somenteMeu: e.target.checked, divideComGrupo: false, splits: [] })}
              />
              Somente para mim
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: 'var(--app-text-2)' }}>
              <input
                type="checkbox"
                checked={form.divideComGrupo}
                onChange={(e) => setForm({
                  ...form,
                  divideComGrupo: e.target.checked,
                  somenteMeu: false,
                  splits: e.target.checked ? defaultSplits() : [],
                })}
              />
              Dividir com grupo
              {form.divideComGrupo && grupoAbas.length > 0 && (
                <select
                  className="af-select"
                  value={form.grupoId}
                  onChange={(e) => setForm({ ...form, grupoId: e.target.value })}
                  style={{ marginLeft: 8, fontSize: 13 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {grupoAbas.map((a) => (
                    <option key={a.id} value={String(a.id)}>{a.nome}</option>
                  ))}
                </select>
              )}
              {form.divideComGrupo && grupoAbas.length === 0 && (
                <span style={{ marginLeft: 8, fontSize: 11, color: 'var(--app-warn)' }}>
                  Nenhum grupo criado. Crie em Gestão → Pessoas.
                </span>
              )}
            </label>
          </div>

          {/* Splits — só quando dividir com grupo */}
          {formAbaIsGrupo && (
            <div>
              <div className="t-label" style={{ marginBottom: 8 }}>Divisão por pessoa (%)</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {form.splits.length === 0 && (
                  <span style={{ fontSize: 11, color: 'var(--app-warn)' }}>
                    Nenhuma pessoa no grupo. Adicione em Gestão → Pessoas.
                  </span>
                )}
                {form.splits.map((s, i) => {
                  const pessoa = pessoas.find((p) => p.id === parseInt(s.pessoaId))
                  return (
                    <div key={s.pessoaId} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 13, color: 'var(--app-text-2)', width: 100 }}>{pessoa?.nome}</span>
                      <input
                        className="af-input mono"
                        type="number" min="0" max="100"
                        value={s.percentual}
                        style={{ width: 80 }}
                        onChange={(e) => {
                          const updated = [...form.splits]
                          updated[i] = { ...s, percentual: e.target.value }
                          setForm({ ...form, splits: updated })
                        }}
                      />
                      <span style={{ fontSize: 12, color: 'var(--app-text-faint)' }}>%</span>
                    </div>
                  )
                })}
                {form.splits.length > 0 && Math.abs(somaSplits - 100) > 0.01 && (
                  <span style={{ fontSize: 11, color: 'var(--app-danger)' }}>
                    Total: {somaSplits}% (deve ser 100%)
                  </span>
                )}
              </div>
            </div>
          )}

          <FormField label="Notas">
            <input className="af-input" value={form.notas} onChange={(e) => setForm({ ...form, notas: e.target.value })} placeholder="Opcional" />
          </FormField>

          {/* Recorrência */}
          <div style={{ display: 'flex', gap: 16 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: 'var(--app-text-2)' }}>
              <input type="checkbox" checked={form.recorrente} onChange={(e) => setForm({ ...form, recorrente: e.target.checked, parcelado: false })} />
              Recorrente
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: 'var(--app-text-2)' }}>
              <input type="checkbox" checked={form.parcelado} onChange={(e) => setForm({ ...form, parcelado: e.target.checked, recorrente: false })} />
              Parcelado
            </label>
          </div>

          {form.recorrente && (
            <FormField label="Repetir por quantos meses">
              <input className="af-input mono" type="number" min="1" max="120" value={form.mesesRecorrencia} onChange={(e) => setForm({ ...form, mesesRecorrencia: e.target.value })} />
            </FormField>
          )}
          {form.parcelado && (
            <FormField label="Total de parcelas">
              <input className="af-input mono" type="number" min="2" max="60" value={form.totalParcelas} onChange={(e) => setForm({ ...form, totalParcelas: e.target.value })} />
            </FormField>
          )}

          <div className="flex gap-3" style={{ justifyContent: 'flex-end', marginTop: 8 }}>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saveDisabled}>
              {saving ? (editTarget ? 'Atualizando...' : 'Salvando...') : editTarget ? 'Atualizar' : 'Adicionar'}
            </Button>
          </div>
        </div>
        )}
      </Modal>

      {/* Delete confirmation */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Excluir despesa" maxWidth={400}>
        {deleteTarget && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <p style={{ color: 'var(--app-text-2)', fontSize: 14 }}>
              Excluir <strong style={{ color: 'var(--app-text)' }}>{deleteTarget.descricao}</strong>?
            </p>
            {(deleteTarget.tipo === 'fixa' || deleteTarget.tipo === 'parcela') ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <Button variant="danger" onClick={() => handleDelete(deleteTarget, true)}>
                  Excluir toda a série
                </Button>
                <Button variant="secondary" onClick={() => handleDelete(deleteTarget, false)}>
                  Excluir só este mês
                </Button>
              </div>
            ) : (
              <div className="flex gap-3" style={{ justifyContent: 'flex-end' }}>
                <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
                <Button variant="danger" onClick={() => handleDelete(deleteTarget, false)}>Excluir</Button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </>
  )
}
