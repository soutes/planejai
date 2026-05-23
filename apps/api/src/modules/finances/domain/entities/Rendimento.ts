export interface Rendimento {
  id: number
  mesRef: string
  descricao: string
  categoria: string
  valor: number
  recorrente: boolean
  totalRepeticoes: number | null
  origemId: number | null
}

export interface CreateRendimentoInput {
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
}
