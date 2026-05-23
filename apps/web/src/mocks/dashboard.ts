export const MOCK_DASHBOARD = {
  mesRef: '',
  totalRendimentos: 0,
  totalDespesas: 0,
  totalInvestido: 0,
  saldo: 0,
  despesasPorCategoria: [] as { categoria: string; total: number; percentual: number }[],
  despesasPorAba: [] as { abaId: number; abaNome: string; abaCor: string; total: number }[],
  orcamentos: [] as { abaId: number; categoria: string; valorMeta: number; gasto: number }[],
  divisoesPendentes: [] as { id: number; pessoaId: number; pessoaNome: string; valorTotal: number; direcao: string; descricao: string }[],
}

export const MOCK_EVOLUCAO_12M = [
  { mes: '2025-06', rendimentos: 7200, despesas: 4100 },
  { mes: '2025-07', rendimentos: 7500, despesas: 4300 },
  { mes: '2025-08', rendimentos: 7200, despesas: 4800 },
  { mes: '2025-09', rendimentos: 8000, despesas: 4200 },
  { mes: '2025-10', rendimentos: 7800, despesas: 4500 },
  { mes: '2025-11', rendimentos: 8200, despesas: 5100 },
  { mes: '2025-12', rendimentos: 9500, despesas: 6200 },
  { mes: '2026-01', rendimentos: 7500, despesas: 4100 },
  { mes: '2026-02', rendimentos: 7800, despesas: 4400 },
  { mes: '2026-03', rendimentos: 8000, despesas: 4300 },
  { mes: '2026-04', rendimentos: 8500, despesas: 4600 },
  { mes: '2026-05', rendimentos: 8500, despesas: 4320.5 },
]
