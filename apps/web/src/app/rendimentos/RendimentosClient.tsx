'use client'

import { useState, useEffect, useMemo } from 'react'
import { Plus, Trash2, Repeat, Receipt, Zap, Wallet } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { FormField } from '@/components/ui/FormField'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatMoney } from '@/components/ui/MoneyValue'
import { apiFetch } from '@/shared/lib/api'
import { formatMesRefNum } from '@/shared/lib/format'
import { useMesRef } from '@/shared/context/MesRefContext'
import { RendimentoMock } from '@/mocks/rendimentos'

interface Pessoa { id: number; nome: string; cor: string; ativo: boolean; familiar: boolean; padrao?: boolean }

const CATEGORIAS = ['Salário', 'Aluguel', 'Freelas', 'Dividendos', 'Outros']

const CAT_COLORS: Record<string, string> = {
  'Salário': '#10F5A3',
  'Aluguel': '#B07AFF',
  'Freelas': '#6FA9D6',
  'Dividendos': '#FFB347',
  'Outros': '#5A6273',
}

interface RendimentoForm {
  descricao: string
  categoria: string
  valor: string
  recorrente: boolean
  mesesRecorrencia: string
}

const EMPTY_FORM: RendimentoForm = {
  descricao: '', categoria: 'Salário', valor: '',
  recorrente: false, mesesRecorrencia: '12',
}

function sortByPadrao<T extends { padrao?: boolean; nome: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    if (a.padrao && !b.padrao) return -1
    if (!a.padrao && b.padrao) return 1
    return a.nome.localeCompare(b.nome, 'pt-BR')
  })
}

// null = familiar tab, number = pessoa id, undefined = all (single-user mode, no tabs)
type TabId = number | null | undefined

export function RendimentosClient() {
  const { mesRef } = useMesRef()
  const [rendimentos, setRendimentos] = useState<RendimentoMock[]>([])
  const [pessoas, setPessoas] = useState<Pessoa[]>([])
  const [selectedTab, setSelectedTab] = useState<TabId>(undefined)
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<RendimentoMock | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<RendimentoMock | null>(null)
  const [form, setForm] = useState<RendimentoForm>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    apiFetch<Pessoa[]>('/api/pessoas')
      .then((p) => {
        const ativos = sortByPadrao(p.filter((x) => x.ativo))
        setPessoas(ativos)
        if (ativos.length > 1 && selectedTab === undefined) {
          setSelectedTab(ativos[0].id)
        }
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    apiFetch<RendimentoMock[]>(`/api/rendimentos?mesRef=${mesRef}`)
      .then(setRendimentos)
      .catch(() => setRendimentos([]))
  }, [mesRef])

  const showTabs = pessoas.length > 1

  const displayed = useMemo(() => {
    if (!showTabs || selectedTab === undefined) return rendimentos
    if (selectedTab === null) return rendimentos.filter((r) => r.pessoaId == null)
    return rendimentos.filter((r) => r.pessoaId === selectedTab)
  }, [rendimentos, selectedTab, showTabs])

  const total = displayed.reduce((s, r) => s + r.valor, 0)

  const porCategoria = CATEGORIAS.map((cat) => ({
    name: cat,
    value: displayed.filter((r) => r.categoria === cat).reduce((s, r) => s + r.valor, 0),
  })).filter((d) => d.value > 0)

  const topCat = porCategoria.length > 0 ? porCategoria[0] : null
  const recorrentes = displayed.filter((r) => r.recorrente).length

  const totalAbs = Math.abs(total)
  const totalFormatted = totalAbs.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const totalCommaIdx = totalFormatted.lastIndexOf(',')
  const rendInt = totalFormatted.slice(0, totalCommaIdx)
  const rendDec = totalFormatted.slice(totalCommaIdx)

  function openNew() {
    setEditTarget(null)
    setForm(EMPTY_FORM)
    setModalOpen(true)
  }

  function openEdit(r: RendimentoMock) {
    setEditTarget(r)
    setForm({
      descricao: r.descricao, categoria: r.categoria,
      valor: String(r.valor), recorrente: r.recorrente, mesesRecorrencia: '12',
    })
    setModalOpen(true)
  }

  // pessoaId to attach to a new rendimento: null if familiar tab, number if personal, undefined if no tabs
  const activePessoaId: number | null | undefined = showTabs
    ? (selectedTab === undefined ? undefined : selectedTab)
    : undefined

  async function handleSave() {
    setSaving(true)
    const body: Record<string, unknown> = {
      descricao: form.descricao,
      categoria: form.categoria,
      valor: parseFloat(form.valor),
      mesRef,
      recorrente: form.recorrente,
      totalRepeticoes: form.recorrente ? parseInt(form.mesesRecorrencia) : undefined,
    }
    if (showTabs && activePessoaId !== undefined) {
      body.pessoaId = activePessoaId
    }
    try {
      if (editTarget) {
        await apiFetch(`/api/rendimentos/${editTarget.id}`, { method: 'PUT', body: JSON.stringify(body) })
        setRendimentos((prev) => prev.map((r) => r.id === editTarget.id ? { ...r, ...body } : r))
      } else {
        const created = await apiFetch<RendimentoMock>('/api/rendimentos', { method: 'POST', body: JSON.stringify(body) })
        setRendimentos((prev) => [...prev, created])
      }
    } catch {
      if (!editTarget) {
        setRendimentos((prev) => [...prev, { id: Date.now(), origemId: undefined, recorrente: form.recorrente, ...body } as RendimentoMock])
      }
    }
    setSaving(false)
    setModalOpen(false)
  }

  async function handleDelete(r: RendimentoMock, serie: boolean) {
    try {
      await apiFetch(`/api/rendimentos/${r.id}?serie=${serie}`, { method: 'DELETE' })
    } catch {}
    if (serie && r.origemId) {
      setRendimentos((prev) => prev.filter((x) => x.origemId !== r.origemId))
    } else {
      setRendimentos((prev) => prev.filter((x) => x.id !== r.id))
    }
    setDeleteTarget(null)
  }

  return (
    <>
      {/* Persona tabs */}
      {showTabs && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          {pessoas.map((p) => {
            const isSelected = selectedTab === p.id
            return (
              <button
                key={p.id}
                onClick={() => setSelectedTab(p.id)}
                style={{
                  padding: '6px 18px',
                  borderRadius: 20,
                  border: `1px solid ${isSelected ? p.cor : 'rgba(255,255,255,0.12)'}`,
                  background: isSelected ? `${p.cor}22` : 'transparent',
                  color: isSelected ? p.cor : 'var(--ink-400)',
                  fontSize: 13,
                  fontWeight: isSelected ? 700 : 400,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {p.nome}
              </button>
            )
          })}
          <button
            onClick={() => setSelectedTab(null)}
            style={{
              padding: '6px 18px',
              borderRadius: 20,
              border: `1px solid ${selectedTab === null ? 'var(--verde)' : 'rgba(255,255,255,0.12)'}`,
              background: selectedTab === null ? 'rgba(16,245,163,0.13)' : 'transparent',
              color: selectedTab === null ? 'var(--verde)' : 'var(--ink-400)',
              fontSize: 13,
              fontWeight: selectedTab === null ? 700 : 400,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            Familiar
          </button>
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center justify-between mb-4">
        <Button Icon={Plus} onClick={openNew}>Novo rendimento</Button>
      </div>

      {/* Hero + 3 mini KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 16, marginBottom: 20 }}>

        {/* Hero */}
        <div style={{
          background: 'var(--section-hero-bg, #0E2414)',
          border: '1px solid var(--section-hero-border, rgba(91,153,106,0.28))',
          borderRadius: 16, padding: '28px', overflow: 'hidden',
        }}>
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.10em', color: 'var(--section-accent, #5B996A)', marginBottom: 22 }}>
            Total do mês · {formatMesRefNum(mesRef)}
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 14 }}>
            <span style={{ fontSize: 22, fontWeight: 500, color: '#fff' }}>R$</span>
            <span style={{ fontSize: 64, fontWeight: 700, color: '#fff', lineHeight: 0.95, letterSpacing: '-0.035em', fontVariantNumeric: 'tabular-nums' as const }}>
              {rendInt}
            </span>
            <span style={{ fontSize: 24, fontWeight: 500, color: '#fff', fontVariantNumeric: 'tabular-nums' as const }}>
              {rendDec}
            </span>
          </div>
          <div style={{ fontSize: 13, color: '#fff' }}>
            {displayed.length} lançamento{displayed.length !== 1 ? 's' : ''} no período
          </div>
        </div>

        {/* Mini stack */}
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 16 }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderLeft: '3px solid var(--section-accent, #5B996A)', borderRadius: 16, padding: '20px', flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: 8, background: 'var(--section-accent, #5B996A)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Receipt size={17} color="#fff" />
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.10em', color: '#fff' }}>Lançamentos</span>
            </div>
            <div style={{ fontSize: 40, fontWeight: 700, color: '#fff', lineHeight: 1, letterSpacing: '-0.035em', marginBottom: 6 }}>
              {displayed.length}
            </div>
            <div style={{ fontSize: 12, color: '#fff' }}>registros em {formatMesRefNum(mesRef)}</div>
          </div>

          <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderLeft: '3px solid var(--section-accent, #5B996A)', borderRadius: 16, padding: '20px', flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: 8, background: 'var(--section-accent, #5B996A)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Zap size={17} color="#fff" />
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.10em', color: '#fff' }}>Principal fonte</span>
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--section-accent, #5B996A)', letterSpacing: '-0.02em', marginBottom: 6, fontVariantNumeric: 'tabular-nums' as const }}>
              {topCat ? formatMoney(topCat.value) : '—'}
            </div>
            <div style={{ fontSize: 12, color: '#fff' }}>{topCat ? topCat.name : 'Sem dados'}</div>
          </div>

          <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderLeft: '3px solid var(--section-accent, #5B996A)', borderRadius: 16, padding: '20px', flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: 8, background: 'var(--section-accent, #5B996A)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Repeat size={17} color="#fff" />
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.10em', color: '#fff' }}>Recorrentes</span>
            </div>
            <div style={{ fontSize: 40, fontWeight: 700, color: '#fff', lineHeight: 1, letterSpacing: '-0.035em', marginBottom: 6 }}>
              {recorrentes}
            </div>
            <div style={{ fontSize: 12, color: '#fff' }}>de {displayed.length} lançamento{displayed.length !== 1 ? 's' : ''}</div>
          </div>
        </div>
      </div>

      {/* Table */}
      {displayed.length === 0 ? (
        <div className="af-card" style={{ padding: 0 }}>
          <EmptyState
            icon={Wallet}
            title="Sem rendimentos neste mês"
            subtitle="Nenhum rendimento registrado para o período selecionado."
            ctaLabel="Adicionar rendimento"
            ctaOnClick={openNew}
          />
        </div>
      ) : (
        <div className="af-card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="af-table">
            <thead>
              <tr>
                <th>Descrição</th>
                <th>Categoria</th>
                <th style={{ textAlign: 'right' }}>Valor</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {displayed.map((r) => (
                <tr key={r.id} style={{ cursor: 'pointer' }} onClick={() => openEdit(r)}>
                  <td>
                    <div className="flex items-center gap-2">
                      {r.recorrente && <Repeat size={12} style={{ color: 'var(--app-purple)', flexShrink: 0 }} />}
                      {r.descricao}
                    </div>
                  </td>
                  <td><span className="chip">{r.categoria}</span></td>
                  <td style={{ textAlign: 'right' }}>
                    <span className="mono text-accent" style={{ fontWeight: 700 }}>{formatMoney(r.valor)}</span>
                  </td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => setDeleteTarget(r)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--app-text-faint)', padding: 4 }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editTarget ? 'Editar rendimento' : 'Novo rendimento'}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <FormField label="Descrição" required>
            <input className="af-input" value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} placeholder="Ex: Salário maio" />
          </FormField>
          <div className="form-grid-2">
            <FormField label="Categoria" required>
              <select className="af-select" value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })}>
                {CATEGORIAS.map((c) => <option key={c}>{c}</option>)}
              </select>
            </FormField>
            <FormField label="Valor (R$)" required>
              <input className="af-input mono" type="number" step="0.01" min="0" value={form.valor} onChange={(e) => setForm({ ...form, valor: e.target.value })} placeholder="0,00" />
            </FormField>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: 'var(--app-text-2)' }}>
            <input type="checkbox" checked={form.recorrente} onChange={(e) => setForm({ ...form, recorrente: e.target.checked })} />
            Recorrente (propagar para próximos meses)
          </label>
          {form.recorrente && (
            <FormField label="Repetir por quantos meses">
              <input className="af-input mono" type="number" min="1" max="120" value={form.mesesRecorrencia} onChange={(e) => setForm({ ...form, mesesRecorrencia: e.target.value })} />
            </FormField>
          )}
          <div className="flex gap-3" style={{ justifyContent: 'flex-end', marginTop: 8 }}>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving || !form.descricao || !form.valor}>
              {saving ? 'Salvando...' : editTarget ? 'Salvar' : 'Adicionar'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Excluir rendimento" maxWidth={400}>
        {deleteTarget && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <p style={{ color: 'var(--app-text-2)', fontSize: 14 }}>
              Excluir <strong style={{ color: 'var(--app-text)' }}>{deleteTarget.descricao}</strong>?
            </p>
            {deleteTarget.recorrente ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <Button variant="danger" onClick={() => handleDelete(deleteTarget, true)}>Excluir toda a série</Button>
                <Button variant="secondary" onClick={() => handleDelete(deleteTarget, false)}>Excluir só este mês</Button>
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
