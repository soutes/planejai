import { PageHeader } from '@/components/layout/PageHeader'
import { TrendingUp } from 'lucide-react'
import { RendimentosClient } from './RendimentosClient'

export default function RendimentosPage() {
  return (
    <div data-section="rendimentos">
      <PageHeader
        title="Rendimentos"
        subtitle="Registre suas receitas mensais"
        Icon={TrendingUp}
      />
      <RendimentosClient />
    </div>
  )
}
