// ─── Movimentação de investimento (APORTE | RENDIMENTO | RESGATE) ─────────────

export type TipoMovimentacao = 'APORTE' | 'RENDIMENTO' | 'RESGATE'

export const TIPOS_MOVIMENTACAO: TipoMovimentacao[] = ['APORTE', 'RENDIMENTO', 'RESGATE']

export interface MovimentacaoInvestimento {
  id: number
  investimentoId: number
  mesRef: string   // YYYY-MM
  tipo: TipoMovimentacao
  valor: number    // sempre positivo
  notas: string | null
}

export interface MovimentacaoComPosicao extends MovimentacaoInvestimento {
  posicao: {
    categoria: string
    instituicao: string
  }
}

export interface EvolucaoMensal {
  mesRef: string
  saldo: number
  aportes: number
  rendimentos: number
  resgates: number
}

export interface CreateMovimentacaoInput {
  investimentoId: number
  mesRef: string
  tipo: TipoMovimentacao
  valor: number
  notas?: string | null
}

export interface ListMovimentacoesFilter {
  investimentoId?: number
  mesRef?: string
  tipo?: TipoMovimentacao
  pessoaId?: number | null
}

export interface UpdateMovimentacaoInput {
  mesRef?: string
  tipo?: TipoMovimentacao
  valor?: number
  notas?: string | null
}
