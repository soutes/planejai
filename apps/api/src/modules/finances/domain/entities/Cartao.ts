export interface Cartao {
  id: number
  nome: string
  proprietario: string | null
  finalDigitos: string | null
  cor: string
  limite: number | null
  diaFechamento: number
  diaVencimento: number
  ativo: boolean
  abaId: number | null
  abaPessoaId: number | null
}

export interface CreateCartaoInput {
  nome: string
  proprietario?: string | null
  finalDigitos?: string | null
  cor?: string
  limite?: number | null
  diaFechamento?: number
  diaVencimento?: number
  abaId?: number | null
}

export interface UpdateCartaoInput {
  nome?: string
  proprietario?: string | null
  finalDigitos?: string | null
  cor?: string
  limite?: number | null
  diaFechamento?: number
  diaVencimento?: number
  ativo?: boolean
  abaId?: number | null
}
