// Espelha DashboardData de apps/api/src/modules/finances/application/use-cases/get-dashboard.use-case.ts
// Único payload de números do Dashboard — o cliente não reagrega nada.
export interface DashboardData {
  mesRef: string
  totalDespesas: number
  totalRendimentos: number
  totalInvestido: number
  saldo: number
  qtdRendimentos: number
  despesasPorAba: { abaId: number; abaNome: string; abaCor: string; total: number }[]
  despesasPorCategoria: { categoria: string; total: number; percentual: number }[]
  despesasPorFormaPagamento: { formaPagamentoId: number; nome: string; total: number }[]
  serie: { mesRef: string; despesas: number; rendimentos: number; saldo: number }[]
  patrimonio: {
    valor: number
    classes: number
    serie: { mesRef: string; saldo: number }[]
  }
}

export const EMPTY_DASHBOARD: DashboardData = {
  mesRef: '',
  totalDespesas: 0,
  totalRendimentos: 0,
  totalInvestido: 0,
  saldo: 0,
  qtdRendimentos: 0,
  despesasPorAba: [],
  despesasPorCategoria: [],
  despesasPorFormaPagamento: [],
  serie: [],
  patrimonio: { valor: 0, classes: 0, serie: [] },
}
