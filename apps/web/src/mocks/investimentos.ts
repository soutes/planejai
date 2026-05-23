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

export const MOCK_EVOLUCAO_PATRIMONIO = [
  { mes: '2025-06', total: 40000, aporte: 1800 },
  { mes: '2025-07', total: 42000, aporte: 1900 },
  { mes: '2025-08', total: 43500, aporte: 1700 },
  { mes: '2025-09', total: 44800, aporte: 1600 },
  { mes: '2025-10', total: 46200, aporte: 1800 },
  { mes: '2025-11', total: 47500, aporte: 1900 },
  { mes: '2025-12', total: 49000, aporte: 2000 },
  { mes: '2026-01', total: 50200, aporte: 1700 },
  { mes: '2026-02', total: 52000, aporte: 1900 },
  { mes: '2026-03', total: 53800, aporte: 1900 },
  { mes: '2026-04', total: 56000, aporte: 1900 },
  { mes: '2026-05', total: 58420, aporte: 1900 },
]
