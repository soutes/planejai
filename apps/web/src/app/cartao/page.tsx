import { Suspense } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { CreditCard } from 'lucide-react'
import { CartaoClient } from './CartaoClient'

export default function CartaoPage() {
  return (
    <div data-section="cartao">
      <PageHeader
        title="Cartão de Crédito"
        subtitle="Análise de fatura e acompanhamento do ciclo"
        Icon={CreditCard}
      />
      <Suspense fallback={<div style={{ padding: 40, textAlign: 'center', color: 'var(--app-text-muted)' }}>Carregando...</div>}>
        <CartaoClient />
      </Suspense>
    </div>
  )
}
