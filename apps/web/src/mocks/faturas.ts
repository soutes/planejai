export interface TransacaoMock {
  id: number
  faturaId: number
  data: string
  descricao: string
  estabelecimento: string
  valor: number
  categoria: string
  parcela: string | null
}

export interface FaturaMock {
  id: number
  cartaoId: number
  banco: string
  mesReferencia: string
  vencimento: string
  total: number
  limite: number | null
  comentarioExecutivo: string
  transacoes: TransacaoMock[]
  resumoCategorias: Array<{ categoria: string; valor: number; percentual: number; qtdTransacoes: number }>
}

export const MOCK_FATURAS: FaturaMock[] = []
