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
