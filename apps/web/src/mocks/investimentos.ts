// Tipos do novo modelo Posição + Movimentações (invest-refactor v2)

export interface PosicaoInvestimento {
  id: number
  pessoaId: number | null
  categoria: string
  instituicao: string
  ativo: boolean
  notas: string | null
  saldo_atual: number
  total_investido: number
  total_rendimentos: number
  rentabilidade_pct: number
}

export interface MovimentacaoInvestimento {
  id: number
  investimentoId: number
  mesRef: string   // YYYY-MM
  tipo: 'APORTE' | 'RENDIMENTO' | 'RESGATE'
  valor: number
  notas: string | null
  posicao: {
    categoria: string
    instituicao: string
  }
}

export interface EvolucaoPatrimonio {
  mesRef: string
  saldo: number
  aportes: number
  rendimentos: number
  resgates: number
}

export const MOCK_POSICOES: PosicaoInvestimento[] = []
export const MOCK_MOVIMENTACOES: MovimentacaoInvestimento[] = []
export const MOCK_EVOLUCAO: EvolucaoPatrimonio[] = []

// @deprecated — mantido apenas para compatibilidade residual
export interface InvestimentoMock {
  id: number
  categoria: string
  instituicao: string
  valor: number
  aporteMe: number
  mesRef: string
  pessoaId?: number | null
}

export const MOCK_INVESTIMENTOS: InvestimentoMock[] = []

export const MOCK_EVOLUCAO_PATRIMONIO: EvolucaoPatrimonio[] = []
