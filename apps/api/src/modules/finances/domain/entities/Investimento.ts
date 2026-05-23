export interface Investimento {
  id: number
  pessoaId: number | null
  mesRef: string
  categoria: string
  instituicao: string
  valor: number
  aporteMe: number
  notas: string | null
}

export interface UpsertInvestimentoInput {
  pessoaId?: number | null
  mesRef: string
  categoria: string
  instituicao?: string
  valor: number
  aporteMe?: number
  notas?: string | null
}

export interface ListInvestimentosFilter {
  mesRef?: string
  pessoaId?: number | null
}
