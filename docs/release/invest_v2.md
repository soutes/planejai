# Release — planejAÍ Invest Refactor v2

**Data:** 2026-05-27  
**Team:** planejaí-invest-refactor-team

---

## Módulos implementados

| Módulo | Tipo | Arquivos |
|--------|------|----------|
| Schema Prisma | DB | `apps/api/prisma/schema.prisma` |
| Migration | DB | `apps/api/prisma/migrations/20260527000000_investimento_posicao_movimentacao/` |
| Domain entities | Backend | `Investimento.ts`, `MovimentacaoInvestimento.ts` |
| Repository interfaces | Backend | `IInvestimentoRepository.ts`, `IMovimentacaoInvestimentoRepository.ts` |
| Use cases | Backend | 8 arquivos em `application/use-cases/` |
| Prisma repos | Backend | `prisma-investimento.repository.ts`, `prisma-movimentacao-investimento.repository.ts` |
| Routes | Backend | `investimentos.routes.ts` |
| Module wiring | Backend | `finances.module.ts` |
| Mock types | Frontend | `mocks/investimentos.ts` |
| Componentes | Frontend | `EvolucaoChart`, `DistribuicaoChart`, `PosicaoForm`, `MovimentacaoForm` |
| InvestimentosClient | Frontend | `InvestimentosClient.tsx` |
| Página | Frontend | `page.tsx` |

---

## Schema changes (antes → depois)

### Antes (snapshot mensal)

```
Investimento (id, pessoaId?, mesRef, categoria, instituicao, valor, aporteMe, notas)
Unique: (pessoaId, mesRef, categoria, instituicao)
```

### Depois (posição + movimentações)

```
Investimento (id, pessoaId?, categoria, instituicao, ativo, notas)
Unique: (pessoaId, categoria, instituicao)
FK: pessoaId → Pessoa

MovimentacaoInvestimento (id, investimentoId FK→Investimento CASCADE, mesRef, tipo, valor, notas)
Index: (investimentoId, mesRef), (mesRef)
```

---

## Estratégia de migração de dados

O script `migration.sql` executa em 7 passos atômicos:

1. Cria `MovimentacaoInvestimento` (nova tabela)
2. Cria `Investimento_new` (nova estrutura sem mesRef/valor/aporteMe)
3. Migra posições únicas `(pessoaId, categoria, instituicao)` para `Investimento_new`
4. Para cada snapshot com `aporteMe > 0`: cria `MovimentacaoInvestimento(tipo='APORTE')`
5. Para o mês mais antigo de cada posição com saldo residual: cria `MovimentacaoInvestimento(tipo='RENDIMENTO')` como seed histórico
6. Substitui tabela antiga (`DROP + RENAME`)
7. Recria índice unique

**Garantia de preservação de dados:** todos os aportes e saldos históricos são convertidos para movimentações.

---

## Endpoints novos vs removidos

### Novos

| Método | Rota |
|--------|------|
| GET | `/api/investimentos/posicoes` |
| POST | `/api/investimentos/posicoes` |
| PUT | `/api/investimentos/posicoes/:id` |
| DELETE | `/api/investimentos/posicoes/:id` (soft delete) |
| GET | `/api/investimentos/movimentacoes` |
| POST | `/api/investimentos/movimentacoes` |
| DELETE | `/api/investimentos/movimentacoes/:id` |
| GET | `/api/investimentos/evolucao` |

### Removidos

| Método | Rota | Motivo |
|--------|------|--------|
| GET | `/api/investimentos` | Substituído por `/posicoes` |
| POST | `/api/investimentos` | Substituído por `/posicoes` + `/movimentacoes` |
| DELETE | `/api/investimentos/:id` | Substituído por `/posicoes/:id` (soft delete) |

---

## Decisões de negócio tomadas

| ID | Decisão |
|----|---------|
| DEC-INV-001 | Posição sem `mesRef` — existe permanentemente |
| DEC-INV-002 | `saldo_atual` calculado pelo backend em runtime, não armazenado |
| DEC-INV-003 | Soft delete de posição via `ativo=false` — histórico preservado |
| DEC-INV-004 | Dashboard `totalInvestido` usa `saldo_atual` (não `valor` do snapshot) |
| DEC-INV-005 | Seed de migração: saldo residual → RENDIMENTO apenas no mês mais antigo |

---

## Bugs corrigidos neste release

| Bug | Local | Fix |
|-----|-------|-----|
| `evolData` sempre array vazio | `InvestimentosClient.tsx:111` | Substituído por chamada real à API `/api/investimentos/evolucao` |
| Sem separação aporte/rendimento | Schema | Novo modelo MovimentacaoInvestimento com `tipo` discriminador |
| Sem cálculo de rentabilidade | Backend | `rentabilidade_pct` calculado em `PrismaInvestimentoRepository.findMany()` |
| Dashboard `totalInvestido` usava `i.valor` | `get-dashboard.use-case.ts:97` | Atualizado para `i.saldo_atual` |
| `GenerateReportUseCase` usava `i.valor` e `{ mesRef }` filter | `GenerateReportUseCase.ts:37,43` | Atualizado para `i.saldo_atual` e `{ ativo: true }` |

---

## Próximos passos sugeridos

1. **Rodar migration em produção**: `npx prisma migrate deploy` após parar o servidor
2. **Seed de exemplo**: adicionar dados de investimento no `prisma/seed.ts` para demonstração
3. **US-03 update**: atualizar `docs/user-stories/US-03-registrar-investimento.md` para refletir o novo modelo
4. **Dashboard totalInvestido**: considerar exibir evolução do patrimônio também no dashboard
5. **Filtro de posições inativas**: adicionar opção na UI para visualizar posições desativadas
6. **ERD update**: `docs/erd.mmd` atualizado em sync com `docs/erd.md`
7. **Testes de use case**: `CreateMovimentacaoUseCase` + `GetEvolucaoUseCase` são bons candidatos para testes unitários com repos fake

---

## Builds verificados

- `apps/api`: `npx tsc --noEmit` — **0 erros**
- `apps/api`: `npx prisma generate` — **OK**
- `apps/web`: `npm run build` — **11/11 páginas geradas, 0 erros**
