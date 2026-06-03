import { PageHeader } from '@/components/layout/PageHeader'
import { DashboardPersonaKpis } from './DashboardPersonaKpis'
import { PersonaProvider } from '@/shared/context/PersonaContext'
import { LayoutDashboard } from 'lucide-react'
import { apiFetch, defaultMesRef } from '@/shared/lib/api'
import { formatMesRefNum } from '@/shared/lib/format'

interface DashboardData {
  mesRef: string
  totalDespesas: number
  totalRendimentos: number
  totalInvestido: number
  saldo: number
  despesasPorAba: { abaId: number; abaNome: string; abaCor: string; total: number }[]
  despesasPorCategoria: { categoria: string; total: number; percentual: number }[]
  orcamentos: { abaId: number; categoria: string; valorMeta: number; gasto: number }[]
  divisoesPendentes: { id: number; pessoaId: number; pessoaNome: string; valorTotal: number; direcao: string; descricao: string }[]
  saldoAcertoPendente?: number
}

const EMPTY_DASHBOARD: DashboardData = {
  mesRef: '',
  totalDespesas: 0,
  totalRendimentos: 0,
  totalInvestido: 0,
  saldo: 0,
  despesasPorAba: [],
  despesasPorCategoria: [],
  orcamentos: [],
  divisoesPendentes: [],
}

async function getDashboard(mesRef: string): Promise<DashboardData> {
  try {
    return await apiFetch<DashboardData>(`/api/dashboard?mesRef=${mesRef}`)
  } catch {
    return EMPTY_DASHBOARD
  }
}

function shortMonth(mesRef: string): string {
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
  return months[Number(mesRef.split('-')[1]) - 1]
}

function last12Months(mesRef: string): string[] {
  const [y, m] = mesRef.split('-').map(Number)
  const result: string[] = []
  for (let i = 11; i >= 0; i--) {
    const d = new Date(y, m - 1 - i, 1)
    result.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }
  return result
}

interface Props {
  searchParams: Promise<{ mesRef?: string }>
}

export default async function DashboardPage({ searchParams }: Props) {
  const { mesRef: mesRefParam } = await searchParams
  const mesRef = mesRefParam ?? defaultMesRef()
  const data = await getDashboard(mesRef)

  const porCategoria = data.despesasPorCategoria.map((d) => ({ categoria: d.categoria, valor: d.total }))
  const porAba = data.despesasPorAba.map((d) => ({ aba: d.abaNome, valor: d.total, cor: d.abaCor }))

  const mes12Refs = last12Months(mesRef)
  const mes12Labels = mes12Refs.map(shortMonth)

  return (
    <div data-section="dashboard">
      <div className="mb-6">
        <PageHeader
          title="Dashboard"
          subtitle={`Resumo financeiro de ${formatMesRefNum(mesRef)}`}
          Icon={LayoutDashboard}
        />
      </div>


      <PersonaProvider>
        <DashboardPersonaKpis
          mesRef={mesRef}
          globalDespesas={data.totalDespesas}
          totalRendimentos={data.totalRendimentos}
          totalInvestido={data.totalInvestido}
          globalPorAba={porAba}
          globalPorCategoria={porCategoria}
          mes12Refs={mes12Refs}
          mes12Labels={mes12Labels}
        />
      </PersonaProvider>
    </div>
  )
}
