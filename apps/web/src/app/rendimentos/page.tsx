import { PageHeader } from '@/components/layout/PageHeader'
import { TrendingUp } from 'lucide-react'
import { RendimentosClient } from './RendimentosClient'

export default function RendimentosPage() {
  return (
    <>
      <PageHeader
        title="Rendimentos"
        subtitle="Registre suas receitas mensais"
        Icon={TrendingUp}
      />
      <RendimentosClient />
    </>
  )
}
