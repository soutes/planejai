export interface SaldoDespesa {
  despesaId: number
  descricao: string
  categoria: string
  valorTotal: number
  valorProporcional: number
  valorQuitado: number
  saldoPendente: number
  data: string | null
  mesRef: string
  splitId: number
}

export interface SaldoPessoa {
  pessoaId: number
  nome: string
  cor: string
  saldoMesAtual: number
  pendenciasAnteriores: number
  saldoTotal: number
  direcao: 'a_receber' | 'a_pagar'
  despesas: SaldoDespesa[]
}

export interface AcertoEntry {
  id: number
  pessoaId: number
  pessoa: { id: number; nome: string; cor: string }
  mesRef: string
  valor: number
  data: string
  formaPagamento: string
  observacao: string | null
  criadoEm: Date
  splits: Array<{
    id: number
    splitId: number
    valorCoberto: number
    despesa: { id: number; descricao: string; data: string | null; mesRef: string }
  }>
}

export interface CreateAcertoInput {
  pessoaId: number
  mesRef: string
  valor: number
  data: string
  formaPagamento: string
  observacao?: string
}

export interface HistoricoFilter {
  pessoaId?: number
  mesRefInicio?: string
  mesRefFim?: string
}
