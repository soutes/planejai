import { PageHeader } from '@/components/layout/PageHeader'
import { PieChart } from 'lucide-react'
import { InvestimentosClient } from './InvestimentosClient'

export default function InvestimentosPage() {
  return (
    <div data-section="investimentos">
      <PageHeader
        title="Investimentos"
        subtitle="Snapshot mensal do seu patrimônio"
        Icon={PieChart}
      />
      <InvestimentosClient />
    </div>
  )
}
