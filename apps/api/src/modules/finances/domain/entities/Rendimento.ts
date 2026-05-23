export interface Rendimento {
  id: number
  pessoaId: number | null
  mesRef: string
  descricao: string
  categoria: string
  valor: number
  recorrente: boolean
  totalRepeticoes: number | null
  origemId: number | null
}

export interface CreateRendimentoInput {
  pessoaId?: number | null
  mesRef: string
  descricao: string
  categoria?: string
  valor: number
  recorrente?: boolean
  totalRepeticoes?: number | null
  origemId?: number | null
}

export interface UpdateRendimentoInput {
  descricao?: string
  categoria?: string
  valor?: number
  recorrente?: boolean
}

export interface ListRendimentosFilter {
  mesRef?: string
  pessoaId?: number | null
}
