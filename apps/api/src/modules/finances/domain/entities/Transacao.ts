export interface Transacao {
  id: number
  faturaId: number
  data: string | null
  descricao: string | null
  estabelecimento: string | null
  valor: number | null
  categoria: string | null
  parcela: string | null
}

export interface CreateTransacaoInput {
  faturaId: number
  data?: string | null
  descricao?: string | null
  estabelecimento?: string | null
  valor?: number | null
  categoria?: string | null
  parcela?: string | null
}

export interface UpdateTransacaoInput {
  data?: string | null
  descricao?: string | null
  estabelecimento?: string | null
  valor?: number | null
  categoria?: string | null
  parcela?: string | null
}
