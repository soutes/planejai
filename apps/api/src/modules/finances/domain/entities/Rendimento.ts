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
  // Janela de meses numa query só (série do dashboard). Ignora mesRef quando presente.
  mesRefIn?: string[]
  pessoaId?: number | null
}
