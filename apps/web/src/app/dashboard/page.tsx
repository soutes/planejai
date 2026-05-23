import { PageHeader } from '@/components/layout/PageHeader'
import { DashboardCharts } from './DashboardCharts'
import { MesRefSelector } from './MesRefSelector'
import { CartaoWidget } from './CartaoWidget'
import { DashboardPersonaKpis } from './DashboardPersonaKpis'
import { LayoutDashboard } from 'lucide-react'
import { apiFetch, currentMesRef } from '@/shared/lib/api'
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
  const porAba = data.despesasPorAba.map((d) => ({ aba: d.abaNome, valor: d.total }))

  const isEmpty = data.totalDespesas === 0 && data.totalRendimentos === 0

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <PageHeader
          title="Dashboard"
          subtitle={`Resumo financeiro de ${mesRef}`}
          Icon={LayoutDashboard}
        />
        <MesRefSelector mesRef={mesRef} />
      </div>

      {/* Welcome banner */}
      {isEmpty && (
        <div
          className="af-card mb-6"
          style={{
            borderLeft: '3px solid var(--verde)',
            background: 'rgba(16, 245, 163, 0.04)',
          }}
        >
          <p style={{ fontWeight: 700, fontSize: 16, marginBottom: 12, color: 'var(--app-text)' }}>
            Bem-vindo ao planejAÍ
          </p>
          <ol style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <li style={{ fontSize: 14, color: 'var(--app-text-faint)' }}>
              <a href="/gestao" style={{ color: 'var(--verde)', textDecoration: 'none', fontWeight: 500 }}>
                Cadastre seu cartão de crédito
              </a>
            </li>
            <li style={{ fontSize: 14, color: 'var(--app-text-faint)' }}>
              <a href="/gestao" style={{ color: 'var(--verde)', textDecoration: 'none', fontWeight: 500 }}>
                Configure a chave da IA para analisar faturas
              </a>
            </li>
            <li style={{ fontSize: 14, color: 'var(--app-text-faint)' }}>
              <a href="/despesas" style={{ color: 'var(--verde)', textDecoration: 'none', fontWeight: 500 }}>
                Adicione suas primeiras despesas
              </a>
            </li>
          </ol>
        </div>
      )}

      {/* KPIs + breakdown com selector de persona */}
      <DashboardPersonaKpis
        mesRef={mesRef}
        globalDespesas={data.totalDespesas}
        totalRendimentos={data.totalRendimentos}
        totalInvestido={data.totalInvestido}
        globalPorAba={porAba}
        globalPorCategoria={porCategoria}
      />

      {/* Cartão cycle widget */}
      <div className="mb-6">
        <CartaoWidget />
      </div>

      {/* Charts */}
      <DashboardCharts
        porCategoria={porCategoria}
        evolucao12meses={evolucao12meses}
        evolucaoPatrimonio={[]}
        porAba={porAba}
        totalCiclo={0}
      />

    </>
  )
}
