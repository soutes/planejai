export interface CartaoMock {
  id: number
  nome: string
  finalDigitos: string | null
  cor: string
  limite: number | null
  abaId: number | null
  ativo: boolean
  diaFechamento: number
  proprietario?: string | null
}

export const MOCK_CARTOES: CartaoMock[] = []

export interface SnapshotMock {
  id: number
  cartaoId: number
  cicloInicio: string
  cicloFim: string
  total: number
  mesRef: string
  transacoes: Array<{ descricao: string; valor: number; categoria: string; data: string }>
}

export const MOCK_SNAPSHOTS: SnapshotMock[] = []
