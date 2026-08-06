import { PageHeader } from '@/components/layout/PageHeader'
import { DashboardPersonaKpis } from './DashboardPersonaKpis'
import { PersonaProvider } from '@/shared/context/PersonaContext'
import { LayoutDashboard } from 'lucide-react'
import { apiFetch, defaultMesRef } from '@/shared/lib/api'
import { formatMesRefNum } from '@/shared/lib/format'
import { EMPTY_DASHBOARD, type DashboardData } from './types'
import { ordenarTabsAbas, escopoQueryDaAba, type Pessoa, type Aba } from './persona-tabs'

// Só pra decidir a aba default (mesma ordenação de persona-tabs.ts) e escolher o
// escopo certo do fetch abaixo. Pouco custo — não é a agregação de 12 meses.
async function getPessoasEAbas(): Promise<{ pessoas: Pessoa[]; abas: Aba[] }> {
  try {
    const [pessoas, abas] = await Promise.all([
      apiFetch<Pessoa[]>('/api/pessoas'),
      apiFetch<Aba[]>('/api/abas'),
    ])
    return { pessoas, abas }
  } catch {
    return { pessoas: [], abas: [] }
  }
}

// Busca no escopo da aba default (não mais sempre global): o cliente reaproveita
// esta agregação de 12 meses em vez de refazê-la assim que /api/abas responde —
// antes as duas rodavam em toda visita, uma pro SSR (descartada) e outra pro cliente.
// Falha devolve zeros MARCADOS: num app financeiro, "R$ 0,00" silencioso é
// indistinguível de "mês sem lançamentos" — o cliente precisa saber a diferença.
async function getDashboard(mesRef: string, escopoQs: string): Promise<{ data: DashboardData; falhou: boolean }> {
  try {
    const data = await apiFetch<DashboardData>(`/api/dashboard?mesRef=${mesRef}&${escopoQs}&meses=12`)
    return { data, falhou: false }
  } catch {
    return { data: { ...EMPTY_DASHBOARD, mesRef }, falhou: true }
  }
}

interface Props {
  searchParams: Promise<{ mesRef?: string }>
}

export default async function DashboardPage({ searchParams }: Props) {
  const { mesRef: mesRefParam } = await searchParams
  const mesRef = mesRefParam ?? defaultMesRef()

  const { pessoas, abas } = await getPessoasEAbas()
  const abaInicial = ordenarTabsAbas(abas, pessoas)[0] ?? null
  const escopoQs = abaInicial ? escopoQueryDaAba(abaInicial) : 'escopo=global'

  const { data, falhou } = await getDashboard(mesRef, escopoQs)

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
          initial={data}
          initialFalhou={falhou}
          initialAbaId={abaInicial?.id ?? null}
          initialPessoas={pessoas}
          initialAbas={abas}
        />
      </PersonaProvider>
    </div>
  )
}
