export interface Fatura {
  id: number
  fileHash: string
  arquivoOriginal: string
  banco: string | null
  mesReferencia: string | null
  vencimento: string | null
  total: number | null
  limite: number | null
  comentarioExecutivo: string | null
  analiseJson: string
  criadoEm: string
  cartaoId: number
}

export interface CreateFaturaInput {
  fileHash: string
  arquivoOriginal: string
  banco?: string | null
  mesReferencia?: string | null
  vencimento?: string | null
  total?: number | null
  limite?: number | null
  comentarioExecutivo?: string | null
  analiseJson: string
  criadoEm: string
  cartaoId: number
}

export interface ListFaturasFilter {
  cartaoId?: number
}
