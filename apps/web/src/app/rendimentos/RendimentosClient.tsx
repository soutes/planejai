'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Repeat, Wallet } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { FormField } from '@/components/ui/FormField'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatMoney } from '@/components/ui/MoneyValue'
import { apiFetch, currentMesRef } from '@/shared/lib/api'
import { MOCK_RENDIMENTOS, RendimentoMock } from '@/mocks/rendimentos'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts'

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

export function RendimentosClient() {
  const [mesRef, setMesRef] = useState(currentMesRef())
  const [rendimentos, setRendimentos] = useState<RendimentoMock[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<RendimentoMock | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<RendimentoMock | null>(null)
  const [form, setForm] = useState<RendimentoForm>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    apiFetch<RendimentoMock[]>(`/api/rendimentos?mesRef=${mesRef}`)
      .then(setRendimentos)
      .catch(() => setRendimentos([]))
  }, [mesRef])

  const total = rendimentos.reduce((s, r) => s + r.valor, 0)

  const porCategoria = CATEGORIAS.map((cat) => ({
    name: cat,
    value: rendimentos.filter((r) => r.categoria === cat).reduce((s, r) => s + r.valor, 0),
  })).filter((d) => d.value > 0)

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

  async function handleSave() {
    setSaving(true)
    const body = {
      descricao: form.descricao,
      categoria: form.categoria,
      valor: parseFloat(form.valor),
      mesRef,
      recorrente: form.recorrente,
      mesesRecorrencia: form.recorrente ? parseInt(form.mesesRecorrencia) : undefined,
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
        setRendimentos((prev) => [...prev, { id: Date.now(), origemId: undefined, ...body }])
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
      {/* Controls */}
      <div className="flex items-center justify-between mb-4">
        <input
          type="month"
          className="af-input"
          value={mesRef}
          onChange={(e) => setMesRef(e.target.value)}
          style={{ width: 160 }}
        />
        <Button Icon={Plus} onClick={openNew}>Novo rendimento</Button>
      </div>

      {/* KPI + charts */}
      <div className="grid-2 mb-6">
        <div className="af-glow">
          <div className="t-label" style={{ marginBottom: 8 }}>Total do mês</div>
          <div className="t-kpi mono text-accent">{formatMoney(total)}</div>
          <div style={{ fontSize: 12, color: 'var(--app-text-faint)', marginTop: 6 }}>
            {rendimentos.length} lançamento{rendimentos.length !== 1 ? 's' : ''}
          </div>
        </div>

        <Card title="Por categoria">
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={porCategoria} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                {porCategoria.map((entry, i) => (
                  <Cell key={i} fill={CAT_COLORS[entry.name] ?? '#5A6273'} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => typeof value === 'number' ? formatMoney(value) : String(value ?? '')}
                contentStyle={{ background: '#10141C', border: '1px solid #1F2530', borderRadius: 8 }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 14px' }}>
            {porCategoria.map((d) => (
              <div key={d.name} className="flex items-center gap-2">
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: CAT_COLORS[d.name] ?? '#5A6273' }} />
                <span style={{ fontSize: 11, color: 'var(--app-text-muted)' }}>{d.name}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Table */}
      {rendimentos.length === 0 ? (
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
            {rendimentos.map((r) => (
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
