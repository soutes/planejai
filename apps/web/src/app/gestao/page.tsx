import { PageHeader } from '@/components/layout/PageHeader'
import { Settings } from 'lucide-react'
import { GestaoClient } from './GestaoClient'

export default function GestaoPage() {
  return (
    <div data-section="gestao">
      <PageHeader
        title="Gestão"
        subtitle="Cartões, pessoas, categorias e metas"
        Icon={Settings}
      />
      <GestaoClient />
    </div>
  )
}
