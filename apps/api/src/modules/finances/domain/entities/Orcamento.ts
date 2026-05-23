export interface Orcamento {
  id: number
  abaId: number
  mesRef: string | null
  categoria: string
  valorMeta: number
}

export interface UpsertOrcamentoInput {
  abaId: number
  mesRef?: string | null
  categoria: string
  valorMeta: number
}

export interface ListOrcamentosFilter {
  abaId?: number
  mesRef?: string
}
