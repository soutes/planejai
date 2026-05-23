export interface Categoria {
  id: number
  nome: string
  icon: string
  padrao: boolean
  permanente: boolean
  ativa: boolean
}

export interface CreateCategoriaInput {
  nome: string
  icon?: string
  padrao?: boolean
  permanente?: boolean
}

export interface UpdateCategoriaInput {
  nome?: string
  icon?: string
  ativa?: boolean
}
