import { PageSkeleton } from '@/components/ui/PageSkeleton'

// Fallback de Suspense para TODA rota que não tenha um loading.tsx próprio.
// As páginas são Server Components `async` que buscam da API antes de renderizar;
// sem isto a navegação ficava travada na tela anterior, sem sinal de carregamento.
export default function Loading() {
  return <PageSkeleton />
}
