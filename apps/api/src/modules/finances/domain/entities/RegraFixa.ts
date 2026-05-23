export interface RegraFixa {
  id: number
  abaId: number
  descricao: string
  categoria: string
  valor: number
  diaVencimento: number | null
  ativo: boolean
}

export interface CreateRegraFixaInput {
  abaId: number
  descricao: string
  categoria: string
  valor: number
  diaVencimento?: number | null
}

export interface UpdateRegraFixaInput {
  descricao?: string
  categoria?: string
  valor?: number
  diaVencimento?: number | null
  ativo?: boolean
}
