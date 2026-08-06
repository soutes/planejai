// Regra de tabs de persona (Pessoal × Familiar) do Dashboard — compartilhada entre o
// Server Component (page.tsx, decide o escopo do fetch inicial) e o Client Component
// (DashboardPersonaKpis, decide o escopo ao trocar de aba). Mesma ordenação nos dois
// lados: só assim o SSR escolhe a MESMA aba default que o cliente escolheria, e o
// cliente pode reaproveitar a agregação de 12 meses que o servidor já buscou em vez
// de refazê-la assim que /api/abas responde.
export interface Pessoa {
  id: number
  nome: string
  cor: string
  ativo: boolean
  familiar: boolean
  padrao?: boolean
}

export interface Aba {
  id: number
  nome: string
  cor: string
  pessoaId: number | null
}

export function ordenarTabsAbas(abas: Aba[], pessoas: Pessoa[]): Aba[] {
  const pessoais = abas.filter((a) => a.pessoaId != null)
  const familiar = abas.find((a) => a.pessoaId == null)
  const sorted = [...pessoais].sort((a, b) => {
    const pA = pessoas.find((p) => p.id === a.pessoaId)
    const pB = pessoas.find((p) => p.id === b.pessoaId)
    if (pA?.padrao && !pB?.padrao) return -1
    if (!pA?.padrao && pB?.padrao) return 1
    return a.nome.localeCompare(b.nome, 'pt-BR')
  })
  return familiar ? [...sorted, familiar] : sorted
}

// Querystring de escopo pra /api/dashboard a partir da aba selecionada.
export function escopoQueryDaAba(aba: Aba): string {
  return aba.pessoaId != null ? `escopo=pessoa&pessoaId=${aba.pessoaId}` : 'escopo=familiar'
}
