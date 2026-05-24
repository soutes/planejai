import { PageHeader } from '@/components/layout/PageHeader'
import { TrendingDown } from 'lucide-react'
import { DespesasClient } from './DespesasClient'

export default function DespesasPage() {
  return (
    <div data-section="despesas">
      <PageHeader
        title="Despesas"
        subtitle="Controle seus gastos mensais"
        Icon={TrendingDown}
      />
      <DespesasClient />
    </div>
  )
}
