export type DirecaoDivisao = 'a_receber' | 'a_pagar'

export interface DivisaoEntry {
  id: number
  pessoaId: number
  mesRef: string
  descricao: string
  valorTotal: number
  direcao: DirecaoDivisao
  parcelado: boolean
  totalParcelas: number | null
  parcelaAtual: number | null
  dataInicio: string | null
  origemDespesaId: number | null
  quitado: boolean
  notas: string | null
}

export interface CreateDivisaoInput {
  pessoaId: number
  mesRef: string
  descricao: string
  valorTotal: number
  direcao?: DirecaoDivisao
  parcelado?: boolean
  totalParcelas?: number | null
  parcelaAtual?: number | null
  dataInicio?: string | null
  origemDespesaId?: number | null
  notas?: string | null
}

export interface ListDivisoesFilter {
  pessoaId?: number
  quitado?: boolean
}
