export interface DespesaSplit {
  pessoaId: number
  pessoa: string
  percentual: number
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
  splits?: DespesaSplit[]
}

export const MOCK_DESPESAS: DespesaMock[] = []

export const MOCK_ABAS = [
  { id: 1, nome: 'Pessoal' },
  { id: 2, nome: 'Familiar' },
]

export const MOCK_PESSOAS = [
  { id: 1, nome: 'Eu' },
  { id: 2, nome: 'Cônjuge' },
]

// ID da pessoa "Eu" — used to filter Familiar splits into Pessoal view
export const PESSOA_EU_ID = 1
