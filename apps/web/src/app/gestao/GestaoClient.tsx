'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, CreditCard, Users, Tag, LayoutGrid, Bot, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { FormField } from '@/components/ui/FormField'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatMoney } from '@/components/ui/MoneyValue'
import { apiFetch } from '@/shared/lib/api'
import { MOCK_CARTOES, CartaoMock } from '@/mocks/cartoes'

type GestaoTab = 'cartoes' | 'pessoas' | 'categorias' | 'abas' | 'ia'

/* ---------- Types ---------- */
interface Pessoa { id: number; nome: string; cor: string; familiar?: boolean }
interface Categoria { id: number; nome: string; padrao: boolean; ativo: boolean }
interface Aba { id: number; nome: string; cor: string; pessoaId?: number | null }
interface DivisaoEntry {
  id: number; pessoaId: number; pessoaNome: string
  valor: number; descricao: string; direcao: 'a_receber' | 'a_pagar'
  mesRef: string; quitado: boolean
}

/* ---------- Mock data ---------- */
const MOCK_PESSOAS: Pessoa[] = []

const MOCK_CATS: Categoria[] = [
  { id: 1, nome: 'Alimentação', padrao: true, ativo: true },
  { id: 2, nome: 'Transporte', padrao: true, ativo: true },
  { id: 3, nome: 'Saúde', padrao: true, ativo: true },
  { id: 4, nome: 'Educação', padrao: true, ativo: true },
  { id: 5, nome: 'Lazer', padrao: true, ativo: true },
  { id: 6, nome: 'Casa', padrao: true, ativo: true },
  { id: 7, nome: 'Vestuário', padrao: true, ativo: true },
  { id: 8, nome: 'Assinaturas', padrao: true, ativo: true },
  { id: 9, nome: 'Pets', padrao: true, ativo: true },
  { id: 10, nome: 'Viagem', padrao: true, ativo: true },
  { id: 11, nome: 'Presente', padrao: true, ativo: true },
  { id: 12, nome: 'Cartão', padrao: true, ativo: true },
  { id: 13, nome: 'Outros', padrao: true, ativo: true },
]

const MOCK_ABAS: Aba[] = [
  { id: 1, nome: 'Pessoal', cor: '#10F5A3' },
  { id: 2, nome: 'Familiar', cor: '#B07AFF' },
]

const MOCK_DIVISAO: DivisaoEntry[] = []

/* ================================ */
export function GestaoClient() {
  const [tab, setTab] = useState<GestaoTab>('cartoes')

  return (
    <>
      <div className="tab-bar">
        <button className={`tab-item${tab === 'cartoes' ? ' tab-item--active' : ''}`} onClick={() => setTab('cartoes')}>
          <CreditCard size={14} style={{ display: 'inline', marginRight: 6 }} />Cartões
        </button>
        <button className={`tab-item${tab === 'pessoas' ? ' tab-item--active' : ''}`} onClick={() => setTab('pessoas')}>
          <Users size={14} style={{ display: 'inline', marginRight: 6 }} />Pessoas e Splits
        </button>
        <button className={`tab-item${tab === 'categorias' ? ' tab-item--active' : ''}`} onClick={() => setTab('categorias')}>
          <Tag size={14} style={{ display: 'inline', marginRight: 6 }} />Categorias
        </button>
        <button className={`tab-item${tab === 'abas' ? ' tab-item--active' : ''}`} onClick={() => setTab('abas')}>
          <LayoutGrid size={14} style={{ display: 'inline', marginRight: 6 }} />Abas e Metas
        </button>
        <button className={`tab-item${tab === 'ia' ? ' tab-item--active' : ''}`} onClick={() => setTab('ia')}>
          <Bot size={14} style={{ display: 'inline', marginRight: 6 }} />IA
        </button>
      </div>

      {tab === 'cartoes' && <CartoesSection />}
      {tab === 'pessoas' && <PessoasSection />}
      {tab === 'categorias' && <CategoriasSection />}
      {tab === 'abas' && <AbasSection />}
      {tab === 'ia' && <IASection />}
    </>
  )
}

/* ---- Cartões ---- */
function CartoesSection() {
  const [cartoes, setCartoes] = useState<CartaoMock[]>(MOCK_CARTOES)
  const [abas, setAbas] = useState<Aba[]>([])
  const [pessoas, setPessoas] = useState<Pessoa[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<CartaoMock | null>(null)
  const [form, setForm] = useState({ nome: '', finalDigitos: '', cor: '#10F5A3', limite: '', diaFechamento: '5', abaId: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    apiFetch<CartaoMock[]>('/api/cartoes').then(setCartoes).catch(() => {})
    apiFetch<Aba[]>('/api/abas').then(setAbas).catch(() => {})
    apiFetch<Pessoa[]>('/api/pessoas').then(setPessoas).catch(() => {})
  }, [])

  const familiarAba = abas.find((a) => a.pessoaId == null)
  const pessoaAbas = abas.filter((a) => a.pessoaId != null)
  const defaultAbaId = pessoaAbas[0]?.id ?? familiarAba?.id ?? null

  function openNew() {
    setEditTarget(null)
    setForm({ nome: '', finalDigitos: '', cor: '#10F5A3', limite: '', diaFechamento: '5', abaId: String(defaultAbaId ?? '') })
    setModalOpen(true)
  }
  function openEdit(c: CartaoMock) {
    setEditTarget(c)
    setForm({
      nome: c.nome,
      finalDigitos: c.finalDigitos ?? '',
      cor: c.cor,
      limite: c.limite != null ? String(c.limite) : '',
      diaFechamento: String(c.diaFechamento),
      abaId: c.abaId != null ? String(c.abaId) : String(defaultAbaId ?? ''),
    })
    setModalOpen(true)
  }

  async function handleSave() {
    setSaving(true)
    const limiteNum = parseFloat(form.limite)
    const body = {
      nome: form.nome,
      finalDigitos: form.finalDigitos || null,
      cor: form.cor,
      limite: Number.isFinite(limiteNum) && limiteNum > 0 ? limiteNum : null,
      diaFechamento: parseInt(form.diaFechamento) || 5,
      abaId: form.abaId ? parseInt(form.abaId) : null,
    }
    try {
      if (editTarget) {
        const updated = await apiFetch<CartaoMock>(`/api/cartoes/${editTarget.id}`, { method: 'PUT', body: JSON.stringify(body) })
        setCartoes((p) => p.map((c) => c.id === editTarget.id ? updated : c))
      } else {
        const created = await apiFetch<CartaoMock>('/api/cartoes', { method: 'POST', body: JSON.stringify(body) })
        setCartoes((p) => [...p, created])
      }
      setModalOpen(false)
    } catch (err) {
      alert(`Falha ao salvar cartão: ${err instanceof Error ? err.message : 'erro desconhecido'}`)
    }
    setSaving(false)
  }

  async function handleDelete(c: CartaoMock) {
    try {
      await apiFetch(`/api/cartoes/${c.id}`, { method: 'DELETE' })
      setCartoes((p) => p.map((x) => x.id === c.id ? { ...x, ativo: false } : x))
    } catch (err) {
      alert(`Falha ao desativar: ${err instanceof Error ? err.message : 'erro desconhecido'}`)
    }
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <span style={{ fontSize: 13, color: 'var(--app-text-muted)' }}>{cartoes.filter((c) => c.ativo).length} cartão(ões) ativo(s)</span>
        <Button Icon={Plus} onClick={openNew}>Novo cartão</Button>
      </div>
      {cartoes.length === 0 ? (
        <div className="af-card" style={{ padding: 0 }}>
          <EmptyState
            icon={CreditCard}
            title="Nenhum cartão cadastrado"
            subtitle="Cadastre seu primeiro cartão para começar a usar o planejAÍ."
            ctaLabel="Cadastrar cartão"
            ctaOnClick={openNew}
          />
        </div>
      ) : (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {cartoes.map((c) => (
          <div key={c.id} className="af-card flex items-center justify-between" style={{ opacity: c.ativo ? 1 : 0.4 }}>
            <div className="flex items-center gap-3">
              <div style={{ width: 36, height: 36, borderRadius: 10, background: `${c.cor}20`, border: `1px solid ${c.cor}40`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: c.cor }} />
              </div>
              <div>
                <div className="flex items-center gap-2" style={{ marginBottom: 2 }}>
                  <span style={{ fontWeight: 700, fontSize: 14 }}>{c.nome}{c.finalDigitos ? ` ···${c.finalDigitos}` : ''}</span>
                  {(() => {
                    const aba = abas.find((a) => a.id === c.abaId)
                    if (!aba) return null
                    const isFamiliar = aba.pessoaId == null
                    return (
                      <span className="chip" style={{
                        fontSize: 10,
                        color: isFamiliar ? 'var(--app-purple)' : 'var(--app-accent)',
                        borderColor: isFamiliar ? 'rgba(176,122,255,0.3)' : 'rgba(16,245,163,0.3)',
                      }}>
                        {isFamiliar ? 'Familiar' : `Pessoal · ${aba.nome}`}
                      </span>
                    )
                  })()}
                </div>
                <div style={{ fontSize: 11, color: 'var(--app-text-faint)' }}>Limite: {formatMoney(c.limite)} · Fecha dia {c.diaFechamento}</div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => openEdit(c)}>Editar</Button>
              {c.ativo && c.id !== 1 && (
                <Button variant="danger" size="sm" onClick={() => handleDelete(c)}>Desativar</Button>
              )}
            </div>
          </div>
        ))}
      </div>
      )}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editTarget ? 'Editar cartão' : 'Novo cartão'}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-grid-2">
            <FormField label="Nome do banco" required>
              <input className="af-input" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Ex: Nubank" />
            </FormField>
            <FormField label="4 últimos dígitos">
              <input className="af-input mono" maxLength={4} value={form.finalDigitos} onChange={(e) => setForm({ ...form, finalDigitos: e.target.value })} placeholder="0000" />
            </FormField>
          </div>
          <div className="form-grid-2">
            <FormField label="Limite (R$)">
              <input className="af-input mono" type="number" min="0" value={form.limite} onChange={(e) => setForm({ ...form, limite: e.target.value })} placeholder="5000" />
            </FormField>
            <FormField label="Dia de fechamento">
              <input className="af-input mono" type="number" min="1" max="31" value={form.diaFechamento} onChange={(e) => setForm({ ...form, diaFechamento: e.target.value })} placeholder="5" />
            </FormField>
          </div>
          <div className="form-grid-2">
            <FormField label="Vínculo" required>
              <select className="af-select" value={form.abaId} onChange={(e) => setForm({ ...form, abaId: e.target.value })}>
                {pessoaAbas.map((a) => (
                  <option key={a.id} value={a.id}>Pessoal — {a.nome}</option>
                ))}
                {familiarAba && (
                  <option value={familiarAba.id}>Familiar (split automático)</option>
                )}
              </select>
            </FormField>
            <FormField label="Cor">
              <input type="color" className="af-input" style={{ height: 42, padding: '4px 8px', cursor: 'pointer' }} value={form.cor} onChange={(e) => setForm({ ...form, cor: e.target.value })} />
            </FormField>
          </div>
          <div style={{ fontSize: 11, color: 'var(--app-text-faint)' }}>
            Cartão Familiar: cada fatura importada vira despesa rateada igualmente entre {pessoas.filter((p) => p.familiar).length} pessoa(s) do grupo familiar.
          </div>
          <div className="flex gap-3" style={{ justifyContent: 'flex-end', marginTop: 8 }}>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving || !form.nome || !form.abaId}>{saving ? 'Salvando...' : editTarget ? 'Salvar' : 'Adicionar'}</Button>
          </div>
        </div>
      </Modal>
    </>
  )
}

/* ---- Pessoas e Splits ---- */
function PessoasSection() {
  const [pessoas, setPessoas] = useState<Pessoa[]>(MOCK_PESSOAS)
  const [divisao, setDivisao] = useState<DivisaoEntry[]>(MOCK_DIVISAO)
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Pessoa | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Pessoa | null>(null)
  const [form, setForm] = useState({ nome: '', cor: '#B07AFF', familiar: false })
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    type ApiDivisao = {
      id: number; pessoaId: number; mesRef: string; descricao: string
      valorTotal: number; direcao: 'a_receber' | 'a_pagar'; quitado: boolean
    }
    apiFetch<Pessoa[]>('/api/pessoas').then((ps) => {
      setPessoas(ps)
      apiFetch<ApiDivisao[]>('/api/divisao')
        .then((rows) => setDivisao(rows.map((r) => ({
          id: r.id,
          pessoaId: r.pessoaId,
          pessoaNome: ps.find((p) => p.id === r.pessoaId)?.nome ?? '',
          valor: r.valorTotal,
          descricao: r.descricao,
          direcao: r.direcao,
          mesRef: r.mesRef,
          quitado: r.quitado,
        }))))
        .catch(() => {})
    }).catch(() => {})
  }, [])

  async function handleSavePessoa() {
    setSaving(true)
    const body = { nome: form.nome, cor: form.cor, familiar: form.familiar }
    try {
      if (editTarget) {
        await apiFetch(`/api/pessoas/${editTarget.id}`, { method: 'PUT', body: JSON.stringify(body) })
        setPessoas((p) => p.map((x) => x.id === editTarget.id ? { ...x, ...body } : x))
      } else {
        const created = await apiFetch<Pessoa>('/api/pessoas', { method: 'POST', body: JSON.stringify(body) })
        setPessoas((p) => [...p, created])
      }
    } catch {
      if (!editTarget) setPessoas((p) => [...p, { id: Date.now(), ...body }])
    }
    setSaving(false); setModalOpen(false)
  }

  async function handleDeletePessoa() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await apiFetch(`/api/pessoas/${deleteTarget.id}`, { method: 'DELETE' })
      setPessoas((p) => p.filter((x) => x.id !== deleteTarget.id))
      setDeleteTarget(null)
    } catch (err) {
      alert(`Falha ao excluir: ${err instanceof Error ? err.message : 'erro desconhecido'}`)
    }
    setDeleting(false)
  }

  async function handleQuitar(entry: DivisaoEntry) {
    try { await apiFetch(`/api/divisao/${entry.id}`, { method: 'PUT', body: JSON.stringify({ quitado: true }) }) } catch {}
    setDivisao((d) => d.map((e) => e.id === entry.id ? { ...e, quitado: true } : e))
  }

  const pendentes = divisao.filter((d) => !d.quitado)
  const saldoPorPessoa = pessoas.map((p) => {
    const entries = pendentes.filter((d) => d.pessoaId === p.id)
    const aReceber = entries.filter((d) => d.direcao === 'a_receber').reduce((s, d) => s + d.valor, 0)
    const aPagar = entries.filter((d) => d.direcao === 'a_pagar').reduce((s, d) => s + d.valor, 0)
    return { ...p, saldo: aReceber - aPagar }
  })

  return (
    <>
      <div className="grid-2 mb-6">
        {/* Pessoas */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--app-text-2)' }}>Pessoas</h3>
            <Button Icon={Plus} size="sm" onClick={() => { setEditTarget(null); setForm({ nome: '', cor: '#B07AFF', familiar: false }); setModalOpen(true) }}>
              Adicionar
            </Button>
          </div>
          {pessoas.length === 0 ? (
            <div className="af-card" style={{ padding: 0 }}>
              <EmptyState
                icon={Users}
                title="Nenhuma pessoa cadastrada"
                subtitle="Cadastre pessoas para habilitar divisão automática de despesas."
                ctaLabel="Adicionar pessoa"
                ctaOnClick={() => { setEditTarget(null); setForm({ nome: '', cor: '#B07AFF', familiar: false }); setModalOpen(true) }}
              />
            </div>
          ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {pessoas.map((p) => (
              <div key={p.id} className="af-card flex items-center justify-between" style={{ padding: '12px 16px' }}>
                <div className="flex items-center gap-3">
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: p.cor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#08120D' }}>
                    {p.nome[0].toUpperCase()}
                  </div>
                  <span style={{ fontWeight: 600 }}>{p.nome}</span>
                  {p.familiar && (
                    <span className="chip" style={{ fontSize: 10, color: 'var(--app-purple)', borderColor: 'rgba(176,122,255,0.3)' }}>
                      Familiar
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" onClick={() => { setEditTarget(p); setForm({ nome: p.nome, cor: p.cor, familiar: !!p.familiar }); setModalOpen(true) }}>
                    Editar
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => setDeleteTarget(p)}>
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          )}
        </div>

        {/* Saldos */}
        <div>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--app-text-2)', marginBottom: 12 }}>Saldo por pessoa</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {saldoPorPessoa.map((p) => (
              <div key={p.id} className="af-card flex items-center justify-between" style={{ padding: '12px 16px' }}>
                <span style={{ fontWeight: 600 }}>{p.nome}</span>
                <span className="mono" style={{ fontWeight: 700, color: p.saldo >= 0 ? 'var(--app-accent)' : 'var(--app-danger)', fontSize: 15 }}>
                  {p.saldo >= 0 ? '+' : ''}{formatMoney(p.saldo)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Histórico de divisão */}
      <Card title="Histórico de divisão">
        <table className="af-table">
          <thead>
            <tr>
              <th>Mês</th>
              <th>Pessoa</th>
              <th>Descrição</th>
              <th>Direção</th>
              <th style={{ textAlign: 'right' }}>Valor</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {divisao.map((d) => (
              <tr key={d.id}>
                <td className="mono" style={{ fontSize: 12 }}>{d.mesRef}</td>
                <td style={{ fontWeight: 600 }}>{d.pessoaNome}</td>
                <td style={{ color: 'var(--app-text-muted)' }}>{d.descricao}</td>
                <td>
                  <span className="chip" style={{
                    color: d.direcao === 'a_receber' ? 'var(--app-accent)' : 'var(--app-danger)',
                    borderColor: d.direcao === 'a_receber' ? 'rgba(16,245,163,0.3)' : 'rgba(255,107,122,0.3)',
                  }}>
                    {d.direcao === 'a_receber' ? 'A receber' : 'A pagar'}
                  </span>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <span className="mono" style={{ fontWeight: 700, color: d.direcao === 'a_receber' ? 'var(--app-accent)' : 'var(--app-danger)' }}>
                    {formatMoney(d.valor)}
                  </span>
                </td>
                <td>
                  {d.quitado ? (
                    <span style={{ fontSize: 11, color: 'var(--app-text-faint)' }}>Quitado</span>
                  ) : (
                    <Button size="sm" variant="ghost" onClick={() => handleQuitar(d)}>Quitar</Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Excluir pessoa" maxWidth={420}>
        {deleteTarget && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <p style={{ color: 'var(--app-text-2)', fontSize: 14 }}>
              Excluir <strong style={{ color: 'var(--app-text)' }}>{deleteTarget.nome}</strong>?
            </p>
            <p style={{ color: 'var(--app-text-faint)', fontSize: 12 }}>
              Apaga a aba própria da pessoa e despesas dela.
              Splits familiares envolvendo essa pessoa serão redistribuídos proporcionalmente aos demais.
            </p>
            <div className="flex gap-3" style={{ justifyContent: 'flex-end' }}>
              <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
              <Button variant="danger" onClick={handleDeletePessoa} disabled={deleting}>
                {deleting ? 'Excluindo...' : 'Excluir'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editTarget ? 'Editar pessoa' : 'Nova pessoa'} maxWidth={380}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <FormField label="Nome" required>
            <input className="af-input" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Nome da pessoa" />
          </FormField>
          <FormField label="Cor de identificação">
            <input type="color" className="af-input" style={{ height: 42, padding: '4px 8px', cursor: 'pointer' }} value={form.cor} onChange={(e) => setForm({ ...form, cor: e.target.value })} />
          </FormField>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: 'var(--app-text-2)' }}>
            <input type="checkbox" checked={form.familiar} onChange={(e) => setForm({ ...form, familiar: e.target.checked })} />
            Faz parte do grupo familiar
          </label>
          <div className="flex gap-3" style={{ justifyContent: 'flex-end', marginTop: 8 }}>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSavePessoa} disabled={saving || !form.nome}>
              {saving ? 'Salvando...' : editTarget ? 'Salvar' : 'Adicionar'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}

/* ---- Categorias ---- */
function CategoriasSection() {
  const [categorias, setCategorias] = useState<Categoria[]>(MOCK_CATS)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({ nome: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    apiFetch<Categoria[]>('/api/categorias').then(setCategorias).catch(() => {})
  }, [])

  async function handleAdd() {
    setSaving(true)
    const body = { nome: form.nome }
    try {
      const created = await apiFetch<Categoria>('/api/categorias', { method: 'POST', body: JSON.stringify(body) })
      setCategorias((p) => [...p, created])
    } catch {
      setCategorias((p) => [...p, { id: Date.now(), nome: form.nome, padrao: false, ativo: true }])
    }
    setSaving(false); setModalOpen(false)
  }

  async function handleDeactivate(c: Categoria) {
    try { await apiFetch(`/api/categorias/${c.id}`, { method: 'PUT', body: JSON.stringify({ ativo: false }) }) } catch {}
    setCategorias((p) => p.map((x) => x.id === c.id ? { ...x, ativo: false } : x))
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <span style={{ fontSize: 13, color: 'var(--app-text-muted)' }}>
          {categorias.filter((c) => c.ativo).length} categorias ativas · {categorias.filter((c) => c.padrao).length} padrão
        </span>
        <Button Icon={Plus} onClick={() => { setForm({ nome: '' }); setModalOpen(true) }}>Nova categoria</Button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
        {categorias.map((c) => (
          <div key={c.id} className="af-card flex items-center justify-between" style={{ padding: '10px 14px', opacity: c.ativo ? 1 : 0.4 }}>
            <div className="flex items-center gap-2">
              <Tag size={13} style={{ color: c.padrao ? 'var(--app-accent)' : 'var(--app-purple)' }} />
              <span style={{ fontSize: 13, fontWeight: 600 }}>{c.nome}</span>
              {c.padrao && <span style={{ fontSize: 9, color: 'var(--app-text-faint)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>padrão</span>}
            </div>
            {!c.padrao && c.ativo && (
              <button onClick={() => handleDeactivate(c)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--app-text-faint)', padding: 2 }}>
                <Trash2 size={13} />
              </button>
            )}
          </div>
        ))}
      </div>
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nova categoria" maxWidth={360}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <FormField label="Nome da categoria" required>
            <input className="af-input" value={form.nome} onChange={(e) => setForm({ nome: e.target.value })} placeholder="Ex: Streaming" />
          </FormField>
          <div className="flex gap-3" style={{ justifyContent: 'flex-end' }}>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleAdd} disabled={saving || !form.nome}>{saving ? 'Salvando...' : 'Adicionar'}</Button>
          </div>
        </div>
      </Modal>
    </>
  )
}

/* ---- Abas ---- */
function AbasSection() {
  const [abas, setAbas] = useState<Aba[]>(MOCK_ABAS)
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Aba | null>(null)
  const [form, setForm] = useState({ nome: '', cor: '#6FA9D6' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    apiFetch<Aba[]>('/api/abas').then(setAbas).catch(() => {})
  }, [])

  async function handleSave() {
    setSaving(true)
    const body = { nome: form.nome, cor: form.cor }
    try {
      if (editTarget) {
        await apiFetch(`/api/abas/${editTarget.id}`, { method: 'PUT', body: JSON.stringify(body) })
        setAbas((p) => p.map((a) => a.id === editTarget.id ? { ...a, ...body } : a))
      } else {
        const created = await apiFetch<Aba>('/api/abas', { method: 'POST', body: JSON.stringify(body) })
        setAbas((p) => [...p, created])
      }
    } catch {
      if (!editTarget) setAbas((p) => [...p, { id: Date.now(), ...body }])
    }
    setSaving(false); setModalOpen(false)
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <span style={{ fontSize: 13, color: 'var(--app-text-muted)' }}>{abas.length} aba(s) de despesa</span>
        <Button Icon={Plus} onClick={() => { setEditTarget(null); setForm({ nome: '', cor: '#6FA9D6' }); setModalOpen(true) }}>Nova aba</Button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {abas.map((a) => (
          <div key={a.id} className="af-card flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div style={{ width: 14, height: 14, borderRadius: 4, background: a.cor }} />
              <span style={{ fontWeight: 600 }}>{a.nome}</span>
            </div>
            <Button variant="secondary" size="sm" onClick={() => { setEditTarget(a); setForm({ nome: a.nome, cor: a.cor }); setModalOpen(true) }}>Editar</Button>
          </div>
        ))}
      </div>
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editTarget ? 'Editar aba' : 'Nova aba'} maxWidth={380}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <FormField label="Nome da aba" required>
            <input className="af-input" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Ex: Familiar" />
          </FormField>
          <FormField label="Cor">
            <input type="color" className="af-input" style={{ height: 42, padding: '4px 8px', cursor: 'pointer' }} value={form.cor} onChange={(e) => setForm({ ...form, cor: e.target.value })} />
          </FormField>
          <div className="flex gap-3" style={{ justifyContent: 'flex-end' }}>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving || !form.nome}>{saving ? 'Salvando...' : editTarget ? 'Salvar' : 'Adicionar'}</Button>
          </div>
        </div>
      </Modal>
    </>
  )
}

/* ---- Configuração IA ---- */

const PROVIDER_MODELS: Record<string, string[]> = {
  anthropic: ['claude-sonnet-4-6', 'claude-opus-4-7', 'claude-haiku-4-5-20251001'],
  openai: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'o1', 'o1-mini'],
  openrouter: [],
  gemini: ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-2.0-flash'],
}

const PROVIDER_LABELS: Record<string, string> = {
  anthropic: 'Anthropic',
  openai: 'OpenAI',
  openrouter: 'OpenRouter',
  gemini: 'Google Gemini',
}

interface AIConfigState {
  provider: string
  model: string
  baseUrl: string
  keyConfigured: boolean
  keyPreview: string
}

interface ProbeResult {
  ok: boolean
  latencyMs: number
  sample?: string
  error?: string
}
interface TestResult {
  ok: boolean
  provider: string
  model: string
  baseUrl: string
  text: ProbeResult
  image: ProbeResult
  pdf: ProbeResult
}

function IASection() {
  const [config, setConfig] = useState<AIConfigState>({ provider: 'anthropic', model: 'claude-sonnet-4-6', baseUrl: '', keyConfigured: false, keyPreview: '' })
  const [apiKey, setApiKey] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<TestResult | null>(null)

  useEffect(() => {
    apiFetch<AIConfigState>('/api/config/ia')
      .then((data) => { setConfig(data) })
      .catch(() => {})
  }, [])

  function handleProviderChange(provider: string) {
    const models = PROVIDER_MODELS[provider]
    setConfig((c) => ({ ...c, provider, model: models?.[0] ?? '' }))
  }

  async function runTest(): Promise<void> {
    setTesting(true)
    setTestResult(null)
    try {
      const result = await apiFetch<TestResult>('/api/config/ia/test', {
        method: 'POST', body: JSON.stringify({}),
      })
      setTestResult(result)
    } catch (err) {
      const errProbe = { ok: false, latencyMs: 0, error: err instanceof Error ? err.message : 'erro desconhecido' }
      setTestResult({
        ok: false,
        provider: config.provider,
        model: config.model,
        baseUrl: config.baseUrl,
        text: errProbe, image: errProbe, pdf: errProbe,
      })
    }
    setTesting(false)
  }

  async function handleSave() {
    setSaving(true)
    try {
      const body: Record<string, string> = { provider: config.provider, model: config.model, baseUrl: config.baseUrl }
      if (apiKey) body.apiKey = apiKey
      const updated = await apiFetch<AIConfigState>('/api/config/ia', { method: 'PUT', body: JSON.stringify(body) })
      setConfig(updated)
      setApiKey('')
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
      // Auto-roda teste depois de salvar
      await runTest()
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  async function handleTest() {
    // Salva antes de testar se houver mudanças (apiKey ou modelo/baseUrl)
    try {
      if (apiKey) {
        const body: Record<string, string> = { provider: config.provider, model: config.model, baseUrl: config.baseUrl, apiKey }
        const updated = await apiFetch<AIConfigState>('/api/config/ia', { method: 'PUT', body: JSON.stringify(body) })
        setConfig(updated)
        setApiKey('')
      }
    } catch {}
    await runTest()
  }

  const models = PROVIDER_MODELS[config.provider] ?? []

  return (
    <Card title="Configuração de IA" style={{ maxWidth: 520 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        <FormField label="Provedor">
          <select className="af-input" value={config.provider} onChange={(e) => handleProviderChange(e.target.value)}>
            {Object.entries(PROVIDER_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </FormField>

        <FormField label="API Key">
          <div style={{ position: 'relative' }}>
            <input
              className="af-input mono"
              type={showKey ? 'text' : 'password'}
              value={apiKey || (config.keyConfigured ? config.keyPreview : '')}
              onChange={(e) => setApiKey(e.target.value)}
              onFocus={() => { if (!apiKey) setApiKey('') }}
              placeholder={config.keyConfigured ? 'Chave já configurada — digite para substituir' : 'Cole sua API key aqui'}
              style={{ paddingRight: 40 }}
            />
            <button
              type="button"
              onClick={() => setShowKey((s) => !s)}
              style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-400)' }}
            >
              {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {config.keyConfigured && !apiKey && (
            <span style={{ fontSize: 11, color: 'var(--verde)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
              <CheckCircle size={12} /> Chave configurada
            </span>
          )}
        </FormField>

        {models.length > 0 ? (
          <FormField label="Modelo">
            <select className="af-input" value={config.model} onChange={(e) => setConfig((c) => ({ ...c, model: e.target.value }))}>
              {models.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </FormField>
        ) : (
          <FormField label="Modelo (nome exato do modelo do OpenRouter)">
            <input className="af-input mono" value={config.model} onChange={(e) => setConfig((c) => ({ ...c, model: e.target.value }))} placeholder="ex: meta-llama/llama-3.1-70b-instruct" />
          </FormField>
        )}

        {config.provider === 'openrouter' && (
          <FormField label="Base URL (opcional — padrão: openrouter.ai/api/v1)">
            <input className="af-input mono" value={config.baseUrl} onChange={(e) => setConfig((c) => ({ ...c, baseUrl: e.target.value }))} placeholder="https://openrouter.ai/api/v1" />
          </FormField>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <Button onClick={handleSave} disabled={saving}>{saving ? 'Salvando...' : 'Salvar configuração'}</Button>
          <Button variant="secondary" onClick={handleTest} disabled={testing || (!config.keyConfigured && !apiKey)}>
            {testing ? 'Testando...' : 'Testar IA'}
          </Button>
          {saved && <span style={{ fontSize: 12, color: 'var(--verde)', display: 'flex', alignItems: 'center', gap: 4 }}><CheckCircle size={14} /> Salvo!</span>}
        </div>

        {testResult && (
          <div style={{
            padding: '12px 16px',
            borderRadius: 8,
            border: `1px solid ${testResult.ok ? 'rgba(16,245,163,0.3)' : 'rgba(255,107,122,0.3)'}`,
            background: testResult.ok ? 'rgba(16,245,163,0.06)' : 'rgba(255,107,122,0.06)',
            fontSize: 12,
            lineHeight: 1.5,
          }}>
            <div style={{ color: 'var(--app-text-muted)', fontFamily: 'var(--font-mono)', fontSize: 11, marginBottom: 8 }}>
              {testResult.provider} · {testResult.model}{testResult.baseUrl ? ` · ${testResult.baseUrl}` : ''}
            </div>
            {(['text', 'image', 'pdf'] as const).map((cap) => {
              const labels = { text: 'Texto', image: 'Imagem (JPG/PNG)', pdf: 'PDF' }
              const p = testResult[cap]
              return (
                <div key={cap} style={{ marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, color: p.ok ? 'var(--app-accent)' : 'var(--app-danger)' }}>
                    {p.ok ? <CheckCircle size={13} /> : <AlertCircle size={13} />}
                    <span>{labels[cap]}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--app-text-faint)', fontWeight: 400 }}>
                      {p.ok ? `${p.latencyMs}ms` : 'falhou'}
                    </span>
                  </div>
                  {!p.ok && p.error && (
                    <div style={{ marginTop: 3, marginLeft: 19, padding: '4px 8px', background: 'rgba(0,0,0,0.2)', borderRadius: 4, fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--app-danger)', wordBreak: 'break-word' }}>
                      {p.error}
                    </div>
                  )}
                  {p.ok && p.sample && cap === 'text' && (
                    <div style={{ marginTop: 3, marginLeft: 19, padding: '4px 8px', background: 'rgba(0,0,0,0.2)', borderRadius: 4, fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--app-text)' }}>
                      {p.sample}
                    </div>
                  )}
                </div>
              )
            })}
            {!testResult.pdf.ok && (
              <div style={{ marginTop: 8, padding: 8, background: 'rgba(255,193,7,0.08)', borderRadius: 4, fontSize: 11, color: 'var(--app-warn)', border: '1px solid rgba(255,193,7,0.2)' }}>
                ⚠ Modelo atual NÃO lê PDF. Upload de fatura falhará. Use modelo Anthropic (claude-sonnet-4-6, claude-haiku-4-5) para análise de faturas.
              </div>
            )}
          </div>
        )}

        <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)', fontSize: 12, color: 'var(--ink-400)', lineHeight: 1.6 }}>
          <strong style={{ color: 'var(--ink-600)' }}>Como obter sua API key:</strong><br />
          Anthropic → console.anthropic.com/keys<br />
          OpenAI → platform.openai.com/api-keys<br />
          OpenRouter → openrouter.ai/keys<br />
          Gemini → aistudio.google.com/app/apikey
        </div>
      </div>
    </Card>
  )
}
