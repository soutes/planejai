export interface FormaPagamento {
  id: number
  pessoaId: number
  nome: string
  ativo: boolean
  ordem: number
}

export interface CreateFormaPagamentoInput {
  pessoaId: number
  nome: string
  ativo?: boolean
  ordem?: number
}

export interface ListFormasPagamentoFilter {
  pessoaId: number
  apenasAtivas?: boolean
}
