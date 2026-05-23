'use client'

import { useState, useEffect, useMemo } from 'react'
import { Plus, Trash2, TrendingUp } from 'lucide-react'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
} from 'recharts'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { FormField } from '@/components/ui/FormField'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatMoney } from '@/components/ui/MoneyValue'
import { apiFetch, currentMesRef } from '@/shared/lib/api'
import { InvestimentoMock } from '@/mocks/investimentos'

interface Pessoa { id: number; nome: string; cor: string; ativo: boolean; familiar: boolean }

const CATEGORIAS = [
  'Reserva de Emergência', 'Renda Fixa', 'Tesouro Direto',
  'Ações', 'FIIs', 'Previdência Privada', 'Fundos', 'Cripto', 'Internacional',
]

const CAT_COLORS: Record<string, string> = {
  'Reserva de Emergência': '#10F5A3',
  'Renda Fixa': '#6FA9D6',
  'Tesouro Direto': '#5EEAD4',
  'Ações': '#B07AFF',
  'FIIs': '#F4A261',
  'Previdência Privada': '#60A5FA',
  'Fundos': '#FFB347',
  'Cripto': '#FB7185',
  'Internacional': '#A78BFA',
}

interface InvForm {
  categoria: string
  instituicao: string
  valor: string
  aporteMe: string
}

const EMPTY_FORM: InvForm = {
  categoria: 'Renda Fixa', instituicao: '', valor: '', aporteMe: '0',
}

function formatMesLabel(mes: string): string {
  const [, m] = mes.split('-')
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
  return months[Number(m) - 1]
}

type TabId = number | null | undefined

export function InvestimentosClient() {
  const [mesRef, setMesRef] = useState(currentMesRef())
  const [investimentos, setInvestimentos] = useState<InvestimentoMock[]>([])
  const [pessoas, setPessoas] = useState<Pessoa[]>([])
  const [selectedTab, setSelectedTab] = useState<TabId>(undefined)
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<InvestimentoMock | null>(null)
  const [form, setForm] = useState<InvForm>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    apiFetch<Pessoa[]>('/api/pessoas')
      .then((p) => {
        const ativos = p.filter((x) => x.ativo)
        setPessoas(ativos)
        if (ativos.length > 1 && selectedTab === undefined) {
          setSelectedTab(ativos[0].id)
        }
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    apiFetch<InvestimentoMock[]>(`/api/investimentos?mesRef=${mesRef}`)
      .then(setInvestimentos)
      .catch(() => setInvestimentos([]))
  }, [mesRef])

  const showTabs = pessoas.length > 1

  const displayed = useMemo(() => {
    if (!showTabs || selectedTab === undefined) return investimentos
    if (selectedTab === null) return investimentos.filter((i) => i.pessoaId == null)
    return investimentos.filter((i) => i.pessoaId === selectedTab)
  }, [investimentos, selectedTab, showTabs])

  const total = displayed.reduce((s, i) => s + i.valor, 0)
  const totalAporte = displayed.reduce((s, i) => s + i.aporteMe, 0)

  const pieData = displayed.map((i) => ({
    name: i.categoria,
    value: i.valor,
    pct: total > 0 ? ((i.valor / total) * 100).toFixed(1) : '0',
  }))

  const evolData: { mes: string; Patrimônio: number; Aporte: number }[] = []

  function openNew() {
    setEditTarget(null)
    setForm(EMPTY_FORM)
    setModalOpen(true)
  }

  function openEdit(inv: InvestimentoMock) {
    setEditTarget(inv)
    setForm({
      categoria: inv.categoria,
      instituicao: inv.instituicao,
      valor: String(inv.valor),
      aporteMe: String(inv.aporteMe),
    })
    setModalOpen(true)
  }

  const activePessoaId: number | null | undefined = showTabs
    ? (selectedTab === undefined ? undefined : selectedTab)
    : undefined

  async function handleSave() {
    setSaving(true)
    const body: Record<string, unknown> = {
      categoria: form.categoria,
      instituicao: form.instituicao,
      valor: parseFloat(form.valor),
      aporteMe: parseFloat(form.aporteMe) || 0,
      mesRef,
    }
    if (showTabs && activePessoaId !== undefined) {
      body.pessoaId = activePessoaId
    }
    try {
      const result = await apiFetch<InvestimentoMock>('/api/investimentos', { method: 'POST', body: JSON.stringify(body) })
      setInvestimentos((prev) => {
        const existing = prev.findIndex(
          (i) => i.categoria === body.categoria && i.instituicao === body.instituicao && i.pessoaId === (body.pessoaId ?? null)
        )
        if (existing >= 0) {
          const updated = [...prev]
          updated[existing] = result
          return updated
        }
        return [...prev, result]
      })
    } catch {
      setInvestimentos((prev) => {
        const existing = prev.findIndex(
          (i) => i.categoria === body.categoria && i.instituicao === body.instituicao && i.pessoaId === (body.pessoaId ?? null)
        )
        const item = { id: editTarget?.id ?? Date.now(), ...body } as InvestimentoMock
        if (existing >= 0) {
          const updated = [...prev]
          updated[existing] = item
          return updated
        }
        return [...prev, item]
      })
    }
    setSaving(false)
    setModalOpen(false)
  }

  async function handleDelete(inv: InvestimentoMock) {
    try {
      await apiFetch(`/api/investimentos/${inv.id}`, { method: 'DELETE' })
    } catch {}
    setInvestimentos((prev) => prev.filter((i) => i.id !== inv.id))
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
        <input
          type="month" className="af-input" value={mesRef}
          onChange={(e) => setMesRef(e.target.value)} style={{ width: 160 }}
        />
        <Button Icon={Plus} onClick={openNew}>Novo snapshot</Button>
      </div>

      {/* KPIs */}
      <div className="grid-3 mb-6">
        <div className="af-glow">
          <div className="t-label" style={{ marginBottom: 8 }}>Patrimônio total</div>
          <div className="t-kpi mono text-purple">{formatMoney(total)}</div>
        </div>
        <div className="gf-kpi">
          <div className="t-label" style={{ marginBottom: 8 }}>Aporte do mês</div>
          <div className="t-kpi mono text-accent">{formatMoney(totalAporte)}</div>
        </div>
        <div className="gf-kpi">
          <div className="t-label" style={{ marginBottom: 8 }}>Classes de ativos</div>
          <div className="t-kpi" style={{ color: 'var(--app-text)' }}>{displayed.length}</div>
        </div>
      </div>

      {/* Charts + Table */}
      <div className="grid-2 mb-6">
        {/* Donut */}
        <Card title="Distribuição do patrimônio">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={65} outerRadius={100} paddingAngle={3} dataKey="value">
                {pieData.map((entry, i) => (
                  <Cell key={i} fill={CAT_COLORS[entry.name] ?? '#5A6273'} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value, name) => [typeof value === 'number' ? formatMoney(value) : String(value ?? ''), String(name)]}
                contentStyle={{ background: '#10141C', border: '1px solid #1F2530', borderRadius: 8 }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
            {pieData.map((d) => (
              <div key={d.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: CAT_COLORS[d.name] ?? '#5A6273' }} />
                  <span style={{ fontSize: 12, color: 'var(--app-text-muted)' }}>{d.name}</span>
                </div>
                <span style={{ fontSize: 11, color: 'var(--app-text-faint)' }}>{d.pct}%</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Evolução */}
        <Card title="Evolução patrimonial (12 meses)">
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={evolData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gradPat2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#B07AFF" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#B07AFF" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#4E5768' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#4E5768' }} axisLine={false} tickLine={false} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                formatter={(value) => typeof value === 'number' ? formatMoney(value) : String(value ?? '')}
                contentStyle={{ background: '#10141C', border: '1px solid #1F2530', borderRadius: 8 }}
              />
              <Area type="monotone" dataKey="Patrimônio" stroke="#B07AFF" fill="url(#gradPat2)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Table */}
      {displayed.length === 0 ? (
        <div className="af-card" style={{ padding: 0 }}>
          <EmptyState
            icon={TrendingUp}
            title="Nenhum snapshot registrado"
            subtitle="Registre seu patrimônio mensal para acompanhar a evolução."
            ctaLabel="Registrar snapshot"
            ctaOnClick={openNew}
          />
        </div>
      ) : (
        <div className="af-card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="af-table">
            <thead>
              <tr>
                <th>Categoria</th>
                <th>Instituição</th>
                <th style={{ textAlign: 'right' }}>Aporte do mês</th>
                <th style={{ textAlign: 'right' }}>Saldo total</th>
                <th style={{ textAlign: 'right' }}>% do patrimônio</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {displayed.map((inv) => (
                <tr key={inv.id} style={{ cursor: 'pointer' }} onClick={() => openEdit(inv)}>
                  <td>
                    <div className="flex items-center gap-2">
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: CAT_COLORS[inv.categoria] ?? '#5A6273' }} />
                      {inv.categoria}
                    </div>
                  </td>
                  <td style={{ color: 'var(--app-text-muted)' }}>{inv.instituicao}</td>
                  <td style={{ textAlign: 'right' }}>
                    <span className="mono text-accent" style={{ fontWeight: 600, fontSize: 12 }}>{formatMoney(inv.aporteMe)}</span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <span className="mono text-purple" style={{ fontWeight: 700 }}>{formatMoney(inv.valor)}</span>
                  </td>
                  <td style={{ textAlign: 'right', color: 'var(--app-text-faint)', fontSize: 12 }}>
                    {total > 0 ? ((inv.valor / total) * 100).toFixed(1) : '0'}%
                  </td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleDelete(inv)}
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

      {/* Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editTarget ? 'Editar posição' : 'Nova posição'}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-grid-2">
            <FormField label="Categoria" required>
              <select className="af-select" value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })}>
                {CATEGORIAS.map((c) => <option key={c}>{c}</option>)}
              </select>
            </FormField>
            <FormField label="Instituição" required>
              <input className="af-input" value={form.instituicao} onChange={(e) => setForm({ ...form, instituicao: e.target.value })} placeholder="Ex: Nubank, XP" />
            </FormField>
          </div>
          <div className="form-grid-2">
            <FormField label="Saldo total (R$)" required>
              <input className="af-input mono" type="number" step="0.01" min="0" value={form.valor} onChange={(e) => setForm({ ...form, valor: e.target.value })} placeholder="0,00" />
            </FormField>
            <FormField label="Aporte do mês (R$)">
              <input className="af-input mono" type="number" step="0.01" min="0" value={form.aporteMe} onChange={(e) => setForm({ ...form, aporteMe: e.target.value })} placeholder="0,00" />
            </FormField>
          </div>
          <div className="flex gap-3" style={{ justifyContent: 'flex-end', marginTop: 8 }}>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving || !form.categoria || !form.instituicao || !form.valor}>
              {saving ? 'Salvando...' : editTarget ? 'Salvar' : 'Adicionar'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
