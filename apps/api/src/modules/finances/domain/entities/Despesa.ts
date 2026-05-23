export type DespesaTipo =
  | 'manual'
  | 'fixa'
  | 'parcela'
  | 'cartao'
  | 'cartao_ciclo'
  | 'split_auto'

import type { DespesaSplit } from './DespesaSplit.js'

export interface Despesa {
  id: number
  abaId: number
  mesRef: string
  data: string | null
  descricao: string
  categoria: string
  valor: number
  notas: string | null
  tipo: DespesaTipo
  recorrente: boolean
  totalRepeticoes: number | null
  origemId: number | null
  parcelaNum: number | null
  totalParcelas: number | null
  emFaturaCartao: boolean
  cartaoId: number | null
  somenteMeu: boolean
  splits?: DespesaSplit[]
}

export interface CreateDespesaInput {
  abaId: number
  mesRef: string
  data?: string | null
  descricao: string
  categoria: string
  valor: number
  notas?: string | null
  tipo?: DespesaTipo
  recorrente?: boolean
  totalRepeticoes?: number | null
  parcelaNum?: number | null
  totalParcelas?: number | null
  emFaturaCartao?: boolean
  cartaoId?: number | null
  somenteMeu?: boolean
  origemId?: number | null
}

export interface UpdateDespesaInput {
  data?: string | null
  descricao?: string
  categoria?: string
  valor?: number
  notas?: string | null
  recorrente?: boolean
  somenteMeu?: boolean
}

export interface ListDespesasFilter {
  abaId?: number
  mesRef?: string
  cartaoId?: number
}
