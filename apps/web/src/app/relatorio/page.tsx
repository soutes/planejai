import { PageHeader } from '@/components/layout/PageHeader'
import { FileText } from 'lucide-react'
import { RelatorioClient } from './RelatorioClient'

export default function RelatorioPage() {
  return (
    <>
      <PageHeader
        title="Relatório IA"
        subtitle="Análise executiva do seu mês financeiro"
        Icon={FileText}
      />
      <RelatorioClient />
    </>
  )
}
