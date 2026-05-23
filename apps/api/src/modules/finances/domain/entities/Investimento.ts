export interface Investimento {
  id: number
  mesRef: string
  categoria: string
  instituicao: string
  valor: number
  aporteMe: number
  notas: string | null
}

export interface UpsertInvestimentoInput {
  mesRef: string
  categoria: string
  instituicao?: string
  valor: number
  aporteMe?: number
  notas?: string | null
}

export interface ListInvestimentosFilter {
  mesRef?: string
}
