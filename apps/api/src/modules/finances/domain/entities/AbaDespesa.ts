export interface AbaDespesa {
  id: number
  nome: string
  icon: string
  cor: string
  ordem: number
  splitDestinoCategoria: string | null
  ativo: boolean
  pessoaId: number | null
}

export interface CreateAbaInput {
  nome: string
  icon?: string
  cor?: string
  ordem?: number
  splitDestinoCategoria?: string | null
}

export interface UpdateAbaInput {
  nome?: string
  icon?: string
  cor?: string
  ordem?: number
  splitDestinoCategoria?: string | null
  ativo?: boolean
}
