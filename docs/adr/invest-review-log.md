# Review Log — Invest Refactor v2

**Revisor:** architect-invest-agent  
**Data:** 2026-05-27

---

## [2026-05-27] Revisão completa — APROVADO

### Backend

| Arquivo | Status | Nota |
|---------|--------|------|
| `schema.prisma` | APROVADO | Modelos Investimento e MovimentacaoInvestimento corretos, unique constraint atualizada, FK pessoaId adicionada |
| `migration.sql` | APROVADO | DROP-rename strategy correta para SQLite. Seed de dados migra snapshots → movimentações |
| `domain/entities/Investimento.ts` | APROVADO | Zero imports externos. PosicaoComMetricas com métricas derivadas ✅ |
| `domain/entities/MovimentacaoInvestimento.ts` | APROVADO | TipoMovimentacao como union type, TIPOS_MOVIMENTACAO como constante exportável ✅ |
| `domain/repositories/IInvestimentoRepository.ts` | APROVADO | Sem upsert/delete — deactivate como método semântico ✅ |
| `domain/repositories/IMovimentacaoInvestimentoRepository.ts` | APROVADO | getEvolucao com parâmetros corretos ✅ |
| `application/use-cases/` (8 arquivos) | APROVADO | HttpError direto, validações no use case, sem acoplamento Prisma ✅ |
| `infra/prisma-investimento.repository.ts` | APROVADO | toDomain() inline, métricas calculadas com movimentacoes include ✅ |
| `infra/prisma-movimentacao-investimento.repository.ts` | APROVADO | toDomain() inline, getEvolucao cumulativo correto ✅ |
| `http/investimentos.routes.ts` | APROVADO | Zod schemas corretos, 201 para criação, 204 para delete/deactivate ✅ |
| `finances.module.ts` | APROVADO | 8 use cases registrados, DI manual visível ✅ |
| `get-dashboard.use-case.ts` | APROVADO | totalInvestido usa saldo_atual ✅ |
| `GenerateReportUseCase.ts` | APROVADO | Atualizado para usar saldo_atual ✅ |

### Frontend

| Arquivo | Status | Nota |
|---------|--------|------|
| `mocks/investimentos.ts` | APROVADO | PosicaoInvestimento + MovimentacaoInvestimento + EvolucaoPatrimonio ✅ |
| `InvestimentosClient.tsx` | APROVADO | 'use client', apiFetch, mesRef YYYY-MM, chips coloridos ✅ |
| `page.tsx` | APROVADO | Server Component sem 'use client', subtitle correto ✅ |
| `EvolucaoChart.tsx` | APROVADO | Dados reais da API, gradiente duplo ✅ |
| `DistribuicaoChart.tsx` | APROVADO | PieChart agrupado por categoria ✅ |
| `PosicaoForm.tsx` | APROVADO | Modal com validação categoria + instituicao obrigatórios ✅ |
| `MovimentacaoForm.tsx` | APROVADO | Botão disabled quando valor ≤ 0 ou sem posição ✅ |

### Conformidade arquitetural

- `domain/` nunca importa Fastify/Prisma/SDK ✅
- `toDomain()` inline nos repos ✅
- `HttpError` direto nos use cases ✅
- `mesRef` sempre YYYY-MM ✅
- Valores Float em reais ✅
- `page.tsx` Server Component ✅
- `apiFetch()` usado em todos os calls ✅

**Resultado: APROVADO sem ressalvas**
