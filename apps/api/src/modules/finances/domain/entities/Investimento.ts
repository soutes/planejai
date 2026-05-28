// ─── Posição permanente de investimento ──────────────────────────────────────

export interface Investimento {
  id: number
  pessoaId: number | null
  categoria: string
  instituicao: string
  ativo: boolean
  notas: string | null
}

export interface PosicaoComMetricas extends Investimento {
  saldo_atual: number       // Σ(APORTE) − Σ(RESGATE) + Σ(RENDIMENTO)
  total_investido: number   // Σ(APORTE) − Σ(RESGATE)
  total_rendimentos: number // Σ(RENDIMENTO)
  rentabilidade_pct: number // total_rendimentos / total_investido × 100
}

export interface CreateInvestimentoInput {
  pessoaId?: number | null
  categoria: string
  instituicao?: string
  notas?: string | null
}

export interface UpdateInvestimentoInput {
  categoria?: string
  instituicao?: string
  ativo?: boolean
  notas?: string | null
}

export interface ListPosicoesFilter {
  pessoaId?: number | null
  ativo?: boolean
}
