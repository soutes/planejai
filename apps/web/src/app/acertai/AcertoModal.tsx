'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { FormField } from '@/components/ui/FormField'
import { apiFetch } from '@/shared/lib/api'

type FormaPagamento = 'pix' | 'ted' | 'dinheiro' | 'outro'

const FORMAS: { value: FormaPagamento; label: string }[] = [
  { value: 'pix', label: 'Pix' },
  { value: 'ted', label: 'TED' },
  { value: 'dinheiro', label: 'Dinheiro' },
  { value: 'outro', label: 'Outro' },
]

function hoje(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

interface AcertoModalProps {
  pessoaId: number
  pessoaNome: string
  mesRef: string
  saldoTotal: number
  onClose: () => void
  onConfirmed: () => void
}

export function AcertoModal({ pessoaId, pessoaNome, mesRef, saldoTotal, onClose, onConfirmed }: AcertoModalProps) {
  const [valor, setValor] = useState(String(Math.abs(saldoTotal).toFixed(2)))
  const [data, setData] = useState(hoje())
  const [formaPagamento, setFormaPagamento] = useState<FormaPagamento>('pix')
  const [observacao, setObservacao] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleConfirm() {
    setSaving(true)
    const body = {
      pessoaId,
      mesRef,
      valor: parseFloat(valor),
      data,
      formaPagamento,
      observacao: observacao.trim() || undefined,
    }
    try {
      await apiFetch('/api/acerto', { method: 'POST', body: JSON.stringify(body) })
      onConfirmed()
    } catch (err) {
      console.error('[create acerto]', err)
      alert(`Falha ao registrar acerto: ${err instanceof Error ? err.message : 'erro desconhecido'}`)
      setSaving(false)
    }
  }

  const valorNum = parseFloat(valor)
  const confirmDisabled = saving || !valor || isNaN(valorNum) || valorNum <= 0 || !data

  return (
    <Modal open onClose={onClose} title={`Registrar Acerto — ${pessoaNome}`}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="form-grid-2">
          <FormField label="Valor (R$)" required>
            <input
              className="af-input mono"
              type="number"
              step="0.01"
              min="0"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              placeholder="0,00"
            />
          </FormField>
          <FormField label="Data" required>
            <input
              className="af-input"
              type="date"
              value={data}
              onChange={(e) => setData(e.target.value)}
            />
          </FormField>
        </div>

        <FormField label="Forma de pagamento" required>
          <select
            className="af-select"
            value={formaPagamento}
            onChange={(e) => setFormaPagamento(e.target.value as FormaPagamento)}
          >
            {FORMAS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
        </FormField>

        <FormField label="Observação">
          <textarea
            className="af-input"
            rows={3}
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
            placeholder="Opcional"
            style={{ resize: 'vertical' }}
          />
        </FormField>

        <div className="flex gap-3" style={{ justifyContent: 'flex-end', marginTop: 8 }}>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleConfirm} disabled={confirmDisabled}>
            {saving ? 'Registrando...' : 'Confirmar acerto'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
