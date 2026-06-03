import { PageHeader } from '@/components/layout/PageHeader'
import { HandCoins } from 'lucide-react'
import { AcertoClient } from './AcertoClient'

export default function AcertoPage() {
  return (
    <div data-section="acerto">
      <PageHeader
        title="acertAÍ"
        subtitle="Quem pagou o quê e quanto cada um deve"
        Icon={HandCoins}
      />
      <AcertoClient />
    </div>
  )
}
