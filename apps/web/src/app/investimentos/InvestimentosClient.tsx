'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, TrendingUp } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { FormField } from '@/components/ui/FormField'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatMoney } from '@/components/ui/MoneyValue'
import { apiFetch, currentMesRef } from '@/shared/lib/api'
import { MOCK_INVESTIMENTOS, MOCK_EVOLUCAO_PATRIMONIO, InvestimentoMock } from '@/mocks/investimentos'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Legend,
} from 'recharts'

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

export function InvestimentosClient() {
  const [mesRef, setMesRef] = useState(currentMesRef())
  const [investimentos, setInvestimentos] = useState<InvestimentoMock[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<InvestimentoMock | null>(null)
  const [form, setForm] = useState<InvForm>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    apiFetch<InvestimentoMock[]>(`/api/investimentos?mesRef=${mesRef}`)
      .then(setInvestimentos)
      .catch(() => setInvestimentos([]))
  }, [mesRef])

  const total = investimentos.reduce((s, i) => s + i.valor, 0)
  const totalAporte = investimentos.reduce((s, i) => s + i.aporteMe, 0)

  const pieData = investimentos.map((i) => ({
    name: i.categoria,
    value: i.valor,
    pct: total > 0 ? ((i.valor / total) * 100).toFixed(1) : '0',
  }))

  const evolData = MOCK_EVOLUCAO_PATRIMONIO.map((d) => ({
    mes: formatMesLabel(d.mes),
    Patrimônio: d.total,
    Aporte: d.aporte,
  }))

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

  async function handleSave() {
    setSaving(true)
    const body = {
      categoria: form.categoria,
      instituicao: form.instituicao,
      valor: parseFloat(form.valor),
      aporteMe: parseFloat(form.aporteMe) || 0,
      mesRef,
    }
    try {
      const result = await apiFetch<InvestimentoMock>('/api/investimentos', { method: 'POST', body: JSON.stringify(body) })
      setInvestimentos((prev) => {
        const existing = prev.findIndex((i) => i.categoria === body.categoria && i.instituicao === body.instituicao)
        if (existing >= 0) {
          const updated = [...prev]
          updated[existing] = result
          return updated
        }
        return [...prev, result]
      })
    } catch {
      setInvestimentos((prev) => {
        const existing = prev.findIndex((i) => i.categoria === body.categoria && i.instituicao === body.instituicao)
        const item = { id: editTarget?.id ?? Date.now(), ...body }
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
          <div className="t-kpi" style={{ color: 'var(--app-text)' }}>{investimentos.length}</div>
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
      {investimentos.length === 0 ? (
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
            {investimentos.map((inv) => (
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
