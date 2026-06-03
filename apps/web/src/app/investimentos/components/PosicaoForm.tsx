'use client'

import { useState, useEffect } from 'react'
import { Pencil, Trash2, Plus, Check, X } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { FormField } from '@/components/ui/FormField'
import { formatMoney } from '@/components/ui/MoneyValue'
import { MiniMesSelector } from '@/components/ui/MiniMesSelector'
import type { PosicaoInvestimento, MovimentacaoInvestimento } from '@/types/investimentos'

const CATEGORIAS = [
  'Reserva de Emergência', 'Renda Fixa', 'Tesouro Direto',
  'Ações', 'FIIs', 'Previdência Privada', 'Fundos', 'Cripto', 'Internacional',
]

interface Pessoa {
  id: number
  nome: string
  cor: string
  ativo: boolean
  padrao?: boolean
}

export interface PosicaoFormData {
  categoria: string
  instituicao: string
  pessoaId: number | null
  notas: string
  valorInicial: string
  mesRefAporte: string
}

const TIPO_CHIP: Record<string, { bg: string; color: string; label: string }> = {
  APORTE:     { bg: '#10F5A3', color: '#0A1A12', label: 'Aporte' },
  RENDIMENTO: { bg: '#7B6EF5', color: '#fff',    label: 'Rendimento' },
  RESGATE:    { bg: '#F23A0A', color: '#fff',     label: 'Resgate' },
}

interface MovRow extends MovimentacaoInvestimento {
  posicao: { categoria: string; instituicao: string }
}

interface Props {
  open: boolean
  onClose: () => void
  onSave: (data: PosicaoFormData) => Promise<void>
  editTarget?: PosicaoInvestimento | null
  pessoas: Pessoa[]
  showPessoa: boolean
  defaultMesRef: string
  // movimentações da posição em edição (opcional — só usado no modo edição)
  movimentacoes?: MovRow[]
  onUpdateMovimentacao?: (id: number, data: { mesRef: string; tipo: 'APORTE' | 'RENDIMENTO' | 'RESGATE'; valor: number; notas: string | null }) => Promise<void>
  onDeleteMovimentacao?: (id: number) => Promise<void>
  onAddMovimentacao?: (data: { mesRef: string; tipo: 'APORTE' | 'RENDIMENTO' | 'RESGATE'; valor: number; notas: string | null }) => Promise<void>
}

export function PosicaoForm({
  open, onClose, onSave, editTarget, pessoas, showPessoa, defaultMesRef,
  movimentacoes = [], onUpdateMovimentacao, onDeleteMovimentacao, onAddMovimentacao,
}: Props) {
  // Estado de edição inline de movimentação
  type EditMov = { mesRef: string; tipo: 'APORTE' | 'RENDIMENTO' | 'RESGATE'; valor: string; notas: string }
  const [editMovId, setEditMovId] = useState<number | null>(null)
  const [editMovForm, setEditMovForm] = useState<EditMov | null>(null)
  const [addingMov, setAddingMov] = useState(false)
  const [newMov, setNewMov] = useState<EditMov>({ mesRef: defaultMesRef, tipo: 'APORTE', valor: '', notas: '' })
  const [movSaving, setMovSaving] = useState(false)

  function startEditMov(mov: MovRow) {
    setEditMovId(mov.id)
    setEditMovForm({ mesRef: mov.mesRef, tipo: mov.tipo, valor: String(mov.valor), notas: mov.notas ?? '' })
    setAddingMov(false)
  }

  async function saveEditMov() {
    if (!editMovForm || !editMovId || !onUpdateMovimentacao) return
    const v = parseFloat(editMovForm.valor)
    if (isNaN(v) || v <= 0) return
    setMovSaving(true)
    try {
      await onUpdateMovimentacao(editMovId, {
        mesRef: editMovForm.mesRef,
        tipo: editMovForm.tipo,
        valor: v,
        notas: editMovForm.notas.trim() || null,
      })
      setEditMovId(null)
      setEditMovForm(null)
    } finally { setMovSaving(false) }
  }

  async function deleteMov(id: number) {
    if (!onDeleteMovimentacao) return
    setMovSaving(true)
    try { await onDeleteMovimentacao(id) } finally { setMovSaving(false) }
  }

  async function saveNewMov() {
    if (!onAddMovimentacao) return
    const v = parseFloat(newMov.valor)
    if (isNaN(v) || v <= 0) return
    setMovSaving(true)
    try {
      await onAddMovimentacao({ mesRef: newMov.mesRef, tipo: newMov.tipo, valor: v, notas: newMov.notas.trim() || null })
      setAddingMov(false)
      setNewMov({ mesRef: defaultMesRef, tipo: 'APORTE', valor: '', notas: '' })
    } finally { setMovSaving(false) }
  }

  const makeForm = (target: PosicaoInvestimento | null | undefined): PosicaoFormData =>
    target
      ? { categoria: target.categoria, instituicao: target.instituicao, pessoaId: target.pessoaId, notas: target.notas ?? '', valorInicial: '', mesRefAporte: defaultMesRef }
      : { categoria: 'Renda Fixa', instituicao: '', pessoaId: null, notas: '', valorInicial: '', mesRefAporte: defaultMesRef }

  const [form, setForm] = useState<PosicaoFormData>(() => makeForm(editTarget))
  const [saving, setSaving] = useState(false)

  // Reset form toda vez que o modal abre (evita dados da sessão anterior)
  useEffect(() => {
    if (open) {
      setForm(makeForm(editTarget))
      setEditMovId(null)
      setEditMovForm(null)
      setAddingMov(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const title = editTarget ? 'Editar posição' : 'Nova posição'
  const temValor = !editTarget && !!form.valorInicial && parseFloat(form.valorInicial) > 0

  async function handleSave() {
    if (!form.categoria || !form.instituicao.trim()) return
    setSaving(true)
    try {
      await onSave(form)
      onClose()
    } finally {
      setSaving(false)
    }
  }

  const isValid = !!form.categoria && !!form.instituicao.trim()

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Categoria + Instituição */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <FormField label="Categoria" required>
            <select
              className="af-select"
              value={form.categoria}
              onChange={(e) => setForm({ ...form, categoria: e.target.value })}
            >
              {CATEGORIAS.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Instituição" required>
            <input
              className="af-input"
              value={form.instituicao}
              onChange={(e) => setForm({ ...form, instituicao: e.target.value })}
              placeholder="Ex: Nubank, XP, BTG"
            />
          </FormField>
        </div>

        {/* Pessoa (multi-user) */}
        {showPessoa && (
          <FormField label="Pessoa">
            <select
              className="af-select"
              value={form.pessoaId ?? ''}
              onChange={(e) =>
                setForm({
                  ...form,
                  pessoaId: e.target.value === '' ? null : Number(e.target.value),
                })
              }
            >
              <option value="">Familiar / compartilhado</option>
              {pessoas.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome}
                </option>
              ))}
            </select>
          </FormField>
        )}

        {/* Valor inicial + mês — só na criação */}
        {!editTarget && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <FormField label="Valor já investido (R$)">
              <input
                className="af-input mono"
                type="number"
                step="0.01"
                min="0"
                value={form.valorInicial}
                onChange={(e) => setForm({ ...form, valorInicial: e.target.value })}
                placeholder="0,00 — opcional"
              />
            </FormField>
            <FormField label="Mês do aporte">
              <MiniMesSelector
                value={form.mesRefAporte}
                onChange={(v) => setForm({ ...form, mesRefAporte: v })}
                disabled={!temValor}
              />
            </FormField>
          </div>
        )}

        {/* Notas */}
        <FormField label="Notas">
          <input
            className="af-input"
            value={form.notas}
            onChange={(e) => setForm({ ...form, notas: e.target.value })}
            placeholder="Observações opcionais"
          />
        </FormField>

        {/* Histórico de movimentações — só no modo edição */}
        {editTarget && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--app-text-muted)' }}>
                Histórico de movimentações
              </span>
              <button
                type="button"
                onClick={() => { setAddingMov(true); setEditMovId(null) }}
                style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: '1px solid var(--app-border)', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', color: 'var(--app-text-muted)', fontSize: 12 }}
              >
                <Plus size={12} /> Adicionar
              </button>
            </div>

            {/* Linha de nova movimentação */}
            {addingMov && (
              <div style={{ display: 'grid', gridTemplateColumns: '90px auto 90px 1fr auto', gap: 6, alignItems: 'center', marginBottom: 8, padding: '8px', background: 'var(--surface)', borderRadius: 8 }}>
                <select className="af-select" style={{ fontSize: 12 }} value={newMov.tipo} onChange={(e) => setNewMov({ ...newMov, tipo: e.target.value as 'APORTE' | 'RENDIMENTO' | 'RESGATE' })}>
                  <option value="APORTE">Aporte</option>
                  <option value="RENDIMENTO">Rendimento</option>
                  <option value="RESGATE">Resgate</option>
                </select>
                <MiniMesSelector value={newMov.mesRef} onChange={(v) => setNewMov({ ...newMov, mesRef: v })} />
                <input className="af-input mono" type="number" step="0.01" min="0.01" placeholder="Valor" value={newMov.valor} onChange={(e) => setNewMov({ ...newMov, valor: e.target.value })} style={{ fontSize: 12 }} />
                <input className="af-input" placeholder="Notas" value={newMov.notas} onChange={(e) => setNewMov({ ...newMov, notas: e.target.value })} style={{ fontSize: 12 }} />
                <div style={{ display: 'flex', gap: 4 }}>
                  <button type="button" onClick={saveNewMov} disabled={movSaving || !newMov.valor} style={{ background: 'var(--verde)', border: 'none', borderRadius: 6, padding: '6px 8px', cursor: 'pointer' }}><Check size={13} color="#000" /></button>
                  <button type="button" onClick={() => setAddingMov(false)} style={{ background: 'none', border: '1px solid var(--app-border)', borderRadius: 6, padding: '6px 8px', cursor: 'pointer', color: 'var(--app-text-muted)' }}><X size={13} /></button>
                </div>
              </div>
            )}

            {/* Lista de movimentações existentes */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 240, overflowY: 'auto' }}>
              {movimentacoes.length === 0 && !addingMov && (
                <span style={{ fontSize: 12, color: 'var(--app-text-faint)', padding: '8px 0' }}>Nenhuma movimentação registrada.</span>
              )}
              {[...movimentacoes].sort((a, b) => b.mesRef.localeCompare(a.mesRef)).map((mov) => {
                const chip = TIPO_CHIP[mov.tipo]
                const isEditing = editMovId === mov.id
                return (
                  <div key={mov.id} style={{ display: 'grid', gridTemplateColumns: isEditing ? '90px auto 90px 1fr auto' : '90px 80px 1fr auto', gap: 6, alignItems: 'center', padding: '6px 8px', background: 'var(--surface)', borderRadius: 8 }}>
                    {isEditing && editMovForm ? (
                      <>
                        <select className="af-select" style={{ fontSize: 12 }} value={editMovForm.tipo} onChange={(e) => setEditMovForm({ ...editMovForm, tipo: e.target.value as 'APORTE' | 'RENDIMENTO' | 'RESGATE' })}>
                          <option value="APORTE">Aporte</option>
                          <option value="RENDIMENTO">Rendimento</option>
                          <option value="RESGATE">Resgate</option>
                        </select>
                        <MiniMesSelector value={editMovForm.mesRef} onChange={(v) => setEditMovForm({ ...editMovForm, mesRef: v })} />
                        <input className="af-input mono" type="number" step="0.01" min="0.01" value={editMovForm.valor} onChange={(e) => setEditMovForm({ ...editMovForm, valor: e.target.value })} style={{ fontSize: 12 }} />
                        <input className="af-input" placeholder="Notas" value={editMovForm.notas} onChange={(e) => setEditMovForm({ ...editMovForm, notas: e.target.value })} style={{ fontSize: 12 }} />
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button type="button" onClick={saveEditMov} disabled={movSaving} style={{ background: 'var(--verde)', border: 'none', borderRadius: 6, padding: '6px 8px', cursor: 'pointer' }}><Check size={13} color="#000" /></button>
                          <button type="button" onClick={() => { setEditMovId(null); setEditMovForm(null) }} style={{ background: 'none', border: '1px solid var(--app-border)', borderRadius: 6, padding: '6px 8px', cursor: 'pointer', color: 'var(--app-text-muted)' }}><X size={13} /></button>
                        </div>
                      </>
                    ) : (
                      <>
                        <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 20, background: chip.bg, color: chip.color, fontSize: 10, fontWeight: 700 }}>{chip.label}</span>
                        <span style={{ fontSize: 11, color: 'var(--app-text-muted)', fontVariantNumeric: 'tabular-nums' }}>{mov.mesRef}</span>
                        <span style={{ fontSize: 12, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{formatMoney(mov.valor)}</span>
                        <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                          <button type="button" onClick={() => startEditMov(mov)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--app-text-muted)', padding: 4 }}><Pencil size={13} /></button>
                          <button type="button" onClick={() => deleteMov(mov.id)} disabled={movSaving} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--app-danger, #F23A0A)', padding: 4 }}><Trash2 size={13} /></button>
                        </div>
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving || !isValid}>
            {saving ? 'Salvando...' : editTarget ? 'Salvar' : 'Criar posição'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
