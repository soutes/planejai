'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { FormField } from '@/components/ui/FormField'
import type { PosicaoInvestimento } from '@/mocks/investimentos'

type TipoMovimentacao = 'APORTE' | 'RENDIMENTO' | 'RESGATE'

interface MovimentacaoFormData {
  investimentoId: number | ''
  mesRef: string
  tipo: TipoMovimentacao
  valor: string
  notas: string
}

interface Props {
  open: boolean
  onClose: () => void
  onSave: (data: {
    investimentoId: number
    mesRef: string
    tipo: TipoMovimentacao
    valor: number
    notas?: string | null
  }) => Promise<void>
  posicoes: PosicaoInvestimento[]
  defaultMesRef: string
}

const TIPO_LABELS: Record<TipoMovimentacao, string> = {
  APORTE: 'Aporte',
  RENDIMENTO: 'Rendimento',
  RESGATE: 'Resgate',
}

const TIPO_COLORS: Record<TipoMovimentacao, string> = {
  APORTE: '#10F5A3',
  RENDIMENTO: '#7B6EF5',
  RESGATE: '#F23A0A',
}

export function MovimentacaoForm({ open, onClose, onSave, posicoes, defaultMesRef }: Props) {
  const [form, setForm] = useState<MovimentacaoFormData>({
    investimentoId: '',
    mesRef: defaultMesRef,
    tipo: 'APORTE',
    valor: '',
    notas: '',
  })
  const [saving, setSaving] = useState(false)

  const valorNum = parseFloat(form.valor)
  const isValid =
    form.investimentoId !== '' &&
    !!form.mesRef &&
    !isNaN(valorNum) &&
    valorNum > 0

  async function handleSave() {
    if (!isValid) return
    setSaving(true)
    try {
      await onSave({
        investimentoId: form.investimentoId as number,
        mesRef: form.mesRef,
        tipo: form.tipo,
        valor: valorNum,
        notas: form.notas.trim() || null,
      })
      onClose()
      setForm({
        investimentoId: '',
        mesRef: defaultMesRef,
        tipo: 'APORTE',
        valor: '',
        notas: '',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Registrar movimentação">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Posição */}
        <FormField label="Posição" required>
          <select
            className="af-select"
            value={form.investimentoId}
            onChange={(e) =>
              setForm({ ...form, investimentoId: e.target.value === '' ? '' : Number(e.target.value) })
            }
          >
            <option value="">Selecione a posição</option>
            {posicoes.map((p) => (
              <option key={p.id} value={p.id}>
                {p.categoria} — {p.instituicao}
              </option>
            ))}
          </select>
        </FormField>

        {/* Tipo */}
        <FormField label="Tipo" required>
          <div style={{ display: 'flex', gap: 8 }}>
            {(['APORTE', 'RENDIMENTO', 'RESGATE'] as TipoMovimentacao[]).map((tipo) => {
              const selected = form.tipo === tipo
              return (
                <button
                  key={tipo}
                  type="button"
                  onClick={() => setForm({ ...form, tipo })}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: `1px solid ${selected ? TIPO_COLORS[tipo] : 'rgba(255,255,255,0.12)'}`,
                    background: selected ? `${TIPO_COLORS[tipo]}22` : 'transparent',
                    color: selected ? TIPO_COLORS[tipo] : 'var(--ink-400)',
                    fontSize: 13,
                    fontWeight: selected ? 700 : 400,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  {TIPO_LABELS[tipo]}
                </button>
              )
            })}
          </div>
        </FormField>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {/* Mês */}
          <FormField label="Mês de referência" required>
            <input
              className="af-input mono"
              type="month"
              value={form.mesRef}
              onChange={(e) => setForm({ ...form, mesRef: e.target.value })}
            />
          </FormField>

          {/* Valor */}
          <FormField label="Valor (R$)" required>
            <input
              className="af-input mono"
              type="number"
              step="0.01"
              min="0.01"
              value={form.valor}
              onChange={(e) => setForm({ ...form, valor: e.target.value })}
              placeholder="0,00"
            />
          </FormField>
        </div>

        {/* Notas */}
        <FormField label="Notas">
          <input
            className="af-input"
            value={form.notas}
            onChange={(e) => setForm({ ...form, notas: e.target.value })}
            placeholder="Observações opcionais"
          />
        </FormField>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving || !isValid}>
            {saving ? 'Registrando...' : 'Registrar'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
