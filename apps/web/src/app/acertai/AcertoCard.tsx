'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { formatMoney } from '@/components/ui/MoneyValue'
import { formatDataBR, formatMesRefBR } from '@/shared/lib/format'

export interface SaldoDespesa {
  despesaId: number
  descricao: string
  categoria: string
  valorTotal: number
  valorProporcional: number
  valorQuitado: number
  saldoPendente: number
  data: string | null
  mesRef: string
  splitId: number
}

export interface SaldoPessoa {
  pessoaId: number
  nome: string
  cor: string
  saldoMesAtual: number
  pendenciasAnteriores: number
  saldoTotal: number
  direcao: 'a_receber' | 'a_pagar'
  despesas: SaldoDespesa[]
}

interface AcertoCardProps {
  saldo: SaldoPessoa
  padraoNome?: string | null
}

export function AcertoCard({ saldo, padraoNome }: AcertoCardProps) {
  const [expanded, setExpanded] = useState(false)

  const isAReceber = saldo.direcao === 'a_receber'
  const corSaldo = isAReceber ? 'var(--vermelho)' : 'var(--verde)'
  const valorAbs = Math.abs(saldo.saldoTotal)
  const eu = padraoNome ?? 'você'
  const textoDirecao = isAReceber
    ? `${saldo.nome} → ${eu}`
    : `${eu} → ${saldo.nome}`

  return (
    <div className="af-card" style={{ padding: 0, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: saldo.cor || 'var(--roxo)', flexShrink: 0 }} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--app-text)', letterSpacing: '-0.01em' }}>
              {saldo.nome}
            </div>
            <div style={{ fontSize: 12, color: 'var(--app-text-muted)', marginTop: 2 }}>
              {textoDirecao}
            </div>
          </div>
        </div>
        <div className="mono" style={{ fontSize: 20, fontWeight: 800, color: corSaldo, letterSpacing: '-0.02em', flexShrink: 0 }}>
          {formatMoney(valorAbs)}
        </div>
      </div>

      {/* Expand toggle */}
      {saldo.despesas.length > 0 && (
        <button
          onClick={() => setExpanded((v) => !v)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, width: '100%',
            padding: '10px 20px', background: 'rgba(255,255,255,0.02)', border: 'none',
            borderTop: '1px solid var(--line)', cursor: 'pointer',
            color: 'var(--app-text-muted)', fontSize: 12, fontWeight: 600,
          }}
        >
          {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          {saldo.despesas.length} despesa{saldo.despesas.length !== 1 ? 's' : ''} pendente{saldo.despesas.length !== 1 ? 's' : ''}
        </button>
      )}

      {/* Despesas list */}
      {expanded && saldo.despesas.length > 0 && (
        <div style={{ borderTop: '1px solid var(--line)' }}>
          <table className="af-table">
            <thead>
              <tr>
                <th>Descrição</th>
                <th>Categoria</th>
                <th style={{ textAlign: 'right' }}>Total</th>
                <th style={{ textAlign: 'right' }}>Proporcional</th>
              </tr>
            </thead>
            <tbody>
              {saldo.despesas.map((d) => (
                <tr key={d.splitId}>
                  <td>
                    <div>{d.descricao}</div>
                    {d.data && (
                      <div style={{ fontSize: 10, color: 'var(--app-text-faint)' }}>{formatDataBR(d.data)}</div>
                    )}
                  </td>
                  <td><span className="chip">{d.categoria}</span></td>
                  <td className="mono" style={{ textAlign: 'right', fontSize: 12, color: 'var(--app-text-muted)' }}>
                    {formatMoney(d.valorTotal)}
                  </td>
                  <td className="mono" style={{ textAlign: 'right', fontWeight: 700, color: corSaldo }}>
                    {formatMoney(d.valorProporcional)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
