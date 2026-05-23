'use client'

import { useState, useEffect, useMemo } from 'react'
import { Plus, Trash2, CreditCard, Repeat, ReceiptText } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { FormField } from '@/components/ui/FormField'
import { EmptyState } from '@/components/ui/EmptyState'
import { MoneyValue, formatMoney } from '@/components/ui/MoneyValue'
import { apiFetch, currentMesRef } from '@/shared/lib/api'
import { formatDataBR } from '@/shared/lib/format'
import { useCategorias } from '@/shared/hooks/useCategorias'
import { DespesaMock, DespesaSplit } from '@/mocks/despesas'

interface Pessoa { id: number; nome: string; cor: string; ativo: boolean; familiar: boolean }
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
  abaId: string
  recorrente: boolean
  mesesRecorrencia: string
  parcelado: boolean
  totalParcelas: string
  splits: DespesaFormSplit[]
}

export function DespesasClient() {
  const categorias = useCategorias()
  const [mesRef, setMesRef] = useState(currentMesRef())
  const [pessoas, setPessoas] = useState<Pessoa[]>([])
  const [abas, setAbas] = useState<Aba[]>([])
  const [abaId, setAbaId] = useState<number | null>(null)
  const [despesas, setDespesas] = useState<DespesaMock[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<DespesaMock | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<DespesaMock | null>(null)
  const [form, setForm] = useState<DespesaForm | null>(null)
  const [saving, setSaving] = useState(false)

  // Tabs derivadas: abas por pessoa primeiro, Familiar por último
  const tabAbas = useMemo(() => {
    const pessoais = abas.filter((a) => a.pessoaId != null)
    const familiar = abas.find((a) => a.pessoaId == null)
    return familiar ? [...pessoais, familiar] : pessoais
  }, [abas])

  const familiarAbaId = useMemo(() => abas.find((a) => a.pessoaId == null)?.id ?? null, [abas])
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
    type ApiSplit = { pessoaId: number; ratio: number; valorCalculado: number }
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
            }))
          : undefined,
      }))))
      .catch(() => {})
  }, [mesRef, abas, pessoas])

  // Filtro: aba pessoa = despesas próprias + Familiar onde tem split. Aba Familiar = apenas familiar.
  const filtered = despesas.filter((d) => {
    if (d.tipo === 'cartao_ciclo') return false
    if (abaId == null) return false
    if (d.abaId === abaId) return true
    if (pessoaSelecionada && d.abaId === familiarAbaId && d.splits?.some((s) => s.pessoaId === pessoaSelecionada.id)) {
      return true
    }
    return false
  })

  function efetivo(d: DespesaMock): number {
    if (pessoaSelecionada && d.abaId === familiarAbaId && d.splits) {
      const meu = d.splits.find((s) => s.pessoaId === pessoaSelecionada.id)
      if (meu) return d.valor * (meu.percentual / 100)
    }
    return d.valor
  }

  const total = filtered.reduce((s, d) => s + efetivo(d), 0)

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

  function emptyForm(): DespesaForm {
    return {
      descricao: '', categoria: 'Alimentação', valor: '', data: `${mesRef}-01`,
      notas: '', abaId: String(abaId ?? tabAbas[0]?.id ?? ''),
      recorrente: false, mesesRecorrencia: '12',
      parcelado: false, totalParcelas: '2',
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
      splits: d.splits ? d.splits.map((s) => ({ pessoaId: String(s.pessoaId), percentual: String(s.percentual) })) : defaultSplits(),
    })
    setModalOpen(true)
  }

  async function handleSave() {
    if (!form) return
    setSaving(true)
    const formAbaId = parseInt(form.abaId)
    const isFamiliar = formAbaId === familiarAbaId
    const valor = parseFloat(form.valor)
    const apiSplits = isFamiliar
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
      mesRef,
      tipo,
      recorrente: form.recorrente,
      totalRepeticoes: form.recorrente ? parseInt(form.mesesRecorrencia) : null,
      totalParcelas: form.parcelado ? parseInt(form.totalParcelas) : null,
      splits: apiSplits,
    }

    const localSplits: DespesaSplit[] | undefined = isFamiliar
      ? form.splits.map((s) => ({
          pessoaId: parseInt(s.pessoaId),
          pessoa: pessoas.find((p) => p.id === parseInt(s.pessoaId))?.nome ?? '',
          percentual: parseFloat(s.percentual),
        }))
      : undefined

    try {
      if (editTarget) {
        const updated = await apiFetch<Omit<DespesaMock, 'aba'>>(`/api/despesas/${editTarget.id}`, { method: 'PUT', body: JSON.stringify(body) })
        setDespesas((prev) => prev.map((d) => d.id === editTarget.id
          ? { ...updated, aba: abas.find((a) => a.id === updated.abaId)?.nome ?? '', splits: localSplits }
          : d))
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
  const formAbaIsFamiliar = form ? parseInt(form.abaId) === familiarAbaId : false
  const somaSplits = form ? form.splits.reduce((a, s) => a + parseFloat(s.percentual || '0'), 0) : 0
  const saveDisabled = !form || saving || !form.descricao || !form.valor
    || (formAbaIsFamiliar && Math.abs(somaSplits - 100) > 0.01)

  return (
    <>
      {/* Controls */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div style={{ display: 'flex', gap: 4 }}>
            {tabAbas.map((a) => (
              <button
                key={a.id}
                className={`tab-item${abaId === a.id ? ' tab-item--active' : ''}`}
                onClick={() => setAbaId(a.id)}
              >{a.nome}</button>
            ))}
          </div>
          <input
            type="month"
            className="af-input"
            value={mesRef}
            onChange={(e) => setMesRef(e.target.value)}
            style={{ width: 150 }}
          />
        </div>
        <Button Icon={Plus} onClick={openNew}>Nova despesa</Button>
      </div>

      {/* Summary */}
      <div className="af-glow mb-4" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div className="t-label">Total do período</div>
          <MoneyValue value={total} size="kpi" colored />
        </div>
        <div style={{ fontSize: 13, color: 'var(--app-text-muted)' }}>
          {filtered.length} lançamento{filtered.length !== 1 ? 's' : ''}
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
              <th>Aba</th>
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
                    <span className="mono" style={{ fontWeight: 700, color: 'var(--app-danger)' }}>
                      {formatMoney(efetivo(d))}
                    </span>
                    {pessoaSelecionada && d.abaId === familiarAbaId && d.splits && (
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
          <FormField label="Descrição" required>
            <input className="af-input" value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} placeholder="Ex: Supermercado" />
          </FormField>
          <div className="form-grid-2">
            <FormField label="Categoria" required>
              <select className="af-select" value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })}>
                {categorias.map((c) => <option key={c}>{c}</option>)}
              </select>
            </FormField>
            <FormField label="Aba">
              <select className="af-select" value={form.abaId} onChange={(e) => setForm({ ...form, abaId: e.target.value })}>
                {tabAbas.map((a) => <option key={a.id} value={a.id}>{a.nome}</option>)}
              </select>
            </FormField>
          </div>
          <div className="form-grid-2">
            <FormField label="Valor (R$)" required>
              <input className="af-input mono" type="number" step="0.01" min="0" value={form.valor} onChange={(e) => setForm({ ...form, valor: e.target.value })} placeholder="0,00" />
            </FormField>
            <FormField label="Data" required>
              <input className="af-input" type="date" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} />
            </FormField>
          </div>
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

          {formAbaIsFamiliar && (
            <div>
              <div className="t-label" style={{ marginBottom: 8 }}>Divisão por pessoa (%)</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {form.splits.length === 0 && (
                  <span style={{ fontSize: 11, color: 'var(--app-warn)' }}>
                    Nenhuma pessoa no grupo familiar. Adicione em Gestão → Pessoas.
                  </span>
                )}
                {form.splits.map((s, i) => {
                  const pessoa = pessoas.find((p) => p.id === parseInt(s.pessoaId))
                  return (
                    <div key={s.pessoaId} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 13, color: 'var(--app-text-2)', width: 100 }}>{pessoa?.nome}</span>
                      <input
                        className="af-input mono"
                        type="number"
                        min="0"
                        max="100"
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

          <div className="flex gap-3" style={{ justifyContent: 'flex-end', marginTop: 8 }}>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saveDisabled}>
              {saving ? 'Salvando...' : editTarget ? 'Salvar' : 'Adicionar'}
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
