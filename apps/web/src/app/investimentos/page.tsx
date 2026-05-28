import { PageHeader } from '@/components/layout/PageHeader'
import { TrendingUp } from 'lucide-react'
import { InvestimentosClient } from './InvestimentosClient'

export default function InvestimentosPage() {
  return (
    <div data-section="investimentos">
      <PageHeader
        title="Investimentos"
        subtitle="Posições e rendimentos"
        Icon={TrendingUp}
      />
      <InvestimentosClient />
    </div>
  )
}
