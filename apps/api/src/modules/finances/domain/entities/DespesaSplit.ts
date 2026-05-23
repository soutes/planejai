export interface DespesaSplit {
  id: number
  despesaId: number
  pessoaId: number
  ratio: number
  valorCalculado: number
}

export interface CreateDespesaSplitInput {
  pessoaId: number
  ratio: number
  valorCalculado: number
}
