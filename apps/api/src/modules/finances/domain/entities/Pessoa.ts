export interface Pessoa {
  id: number
  nome: string
  cor: string
  ativo: boolean
  familiar: boolean
  padrao: boolean
}

export interface CreatePessoaInput {
  nome: string
  cor?: string
  familiar?: boolean
}

export interface UpdatePessoaInput {
  nome?: string
  cor?: string
  ativo?: boolean
  familiar?: boolean
  padrao?: boolean
}
