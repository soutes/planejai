export interface RendimentoMock {
  id: number
  descricao: string
  categoria: string
  valor: number
  mesRef: string
  recorrente: boolean
  origemId?: number
}

export const MOCK_RENDIMENTOS: RendimentoMock[] = []
