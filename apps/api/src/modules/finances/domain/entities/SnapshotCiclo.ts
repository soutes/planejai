export interface SnapshotCiclo {
  id: number
  cartaoId: number
  cicloInicio: string
  cicloFim: string
  dataUpload: string
  total: number
  qtdTransacoes: number
  jsonDados: string
}

export interface CreateSnapshotInput {
  cartaoId: number
  cicloInicio: string
  cicloFim: string
  dataUpload: string
  total: number
  qtdTransacoes: number
  jsonDados: string
}

export interface ListSnapshotsFilter {
  cartaoId?: number
}
