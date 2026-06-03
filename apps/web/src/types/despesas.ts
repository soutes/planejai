export interface DespesaSplit {
  pessoaId: number
  pessoa: string
  percentual: number
  valorCalculado?: number
  valorQuitado?: number
}

export interface DespesaMock {
  id: number
  descricao: string
  categoria: string
  valor: number
  data: string | null
  tipo: 'manual' | 'fixa' | 'parcela' | 'cartao' | 'cartao_ciclo' | 'split_auto'
  abaId: number
  aba: string
  mesRef: string
  notas?: string | null
  origemId?: number | null
  parcelaNum?: number | null
  totalParcelas?: number | null
  totalRepeticoes?: number | null
  cartaoId?: number | null
  somenteMeu?: boolean
  recorrente?: boolean
  emFaturaCartao?: boolean
  pagadorId?: number | null
  splits?: DespesaSplit[]
}
