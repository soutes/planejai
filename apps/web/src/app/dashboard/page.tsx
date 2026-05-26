import { PageHeader } from '@/components/layout/PageHeader'
import { DashboardCharts } from './DashboardCharts'
import { DashboardPersonaKpis } from './DashboardPersonaKpis'
import { OnboardingEmpty } from './OnboardingEmpty'
import { PersonaProvider } from '@/shared/context/PersonaContext'
import { LayoutDashboard } from 'lucide-react'
import { apiFetch, currentMesRef } from '@/shared/lib/api'
import { formatMesRefNum } from '@/shared/lib/format'
import { MOCK_DASHBOARD } from '@/mocks/dashboard'

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
}

async function getDashboard(mesRef: string): Promise<DashboardData> {
  try {
    return await apiFetch<DashboardData>(`/api/dashboard?mesRef=${mesRef}`)
  } catch {
    return MOCK_DASHBOARD
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

async function getEvolucao12m(mesRef: string): Promise<{ mes: string; rendimentos: number; despesas: number }[]> {
  const meses = last12Months(mesRef)
  return Promise.all(
    meses.map(async (mes) => {
      try {
        const d = await apiFetch<DashboardData>(`/api/dashboard?mesRef=${mes}`)
        return { mes, rendimentos: d.totalRendimentos, despesas: d.totalDespesas }
      } catch {
        return { mes, rendimentos: 0, despesas: 0 }
      }
    }),
  )
}

interface Props {
  searchParams: Promise<{ mesRef?: string }>
}

export default async function DashboardPage({ searchParams }: Props) {
  const { mesRef: mesRefParam } = await searchParams
  const mesRef = mesRefParam ?? currentMesRef()
  const [data, evolucao12meses] = await Promise.all([
    getDashboard(mesRef),
    getEvolucao12m(mesRef),
  ])

  const porCategoria = data.despesasPorCategoria.map((d) => ({ categoria: d.categoria, valor: d.total }))
  const porAba = data.despesasPorAba.map((d) => ({ aba: d.abaNome, valor: d.total, cor: d.abaCor }))

  const saldo12m = evolucao12meses.map((e) => e.rendimentos - e.despesas)
  const rendimentos12m = evolucao12meses.map((e) => e.rendimentos)
  const despesas12m = evolucao12meses.map((e) => e.despesas)
  const mes12Labels = evolucao12meses.map((e) => shortMonth(e.mes))

  const isEmpty = data.totalDespesas === 0 && data.totalRendimentos === 0

  // Tela de onboarding: sem dados — exibe boas-vindas centrada
  if (isEmpty) {
    return (
      <div data-section="dashboard">
        <OnboardingEmpty />
      </div>
    )
  }

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
          saldo12m={saldo12m}
          rendimentos12m={rendimentos12m}
          despesas12m={despesas12m}
          mes12Labels={mes12Labels}
        />
      </PersonaProvider>

      <DashboardCharts evolucao12meses={evolucao12meses} />
    </div>
  )
}
