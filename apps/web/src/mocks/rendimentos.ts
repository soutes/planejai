export interface RendimentoMock {
  id: number
  descricao: string
  categoria: string
  valor: number
  mesRef: string
  recorrente: boolean
  origemId?: number
  pessoaId?: number | null
}

export const MOCK_RENDIMENTOS: RendimentoMock[] = []
