export interface DespesaSplit {
  id: number
  despesaId: number
  pessoaId: number
  ratio: number
  valorCalculado: number
  valorQuitado: number
}

// O que o repositório grava: já com o valor resolvido.
export interface CreateDespesaSplitInput {
  pessoaId: number
  ratio: number
  valorCalculado: number
}

// O que entra pela borda (HTTP → use case): só a proporção. `valorCalculado` é
// derivado do valor da despesa no use case — cliente não é dono desse número.
export interface SplitProporcaoInput {
  pessoaId: number
  ratio: number
}
