# QA Summary — planejAÍ v2.0
Data: 2026-05-20
Agente: qa-agent

## Resultado geral: 9/10 PASSOU — 0 bugs abertos

## Status por US

| US | Título | Resultado | Relatório final |
|----|--------|-----------|-----------------|
| US-01 | Registrar Despesa | ✅ PASSOU | qa-US-01-retest2-2026-05-20.md |
| US-02 | Registrar Rendimento | ✅ PASSOU | qa-US-02-retest-2026-05-20.md |
| US-03 | Registrar Investimento | ✅ PASSOU | qa-US-03-retest-2026-05-20.md |
| US-04 | Analisar Fatura IA | ✅ PASSOU (parcial) | qa-US-04-2026-05-20.md |
| US-05 | Acompanhar Ciclo | ✅ PASSOU | qa-US-05-2026-05-20.md |
| US-06 | Dashboard | ✅ PASSOU | qa-US-06-retest-2026-05-20.md |
| US-07 | Relatório IA | ✅ APROVADO (estrutural) | qa-US-07-2026-05-20.md |
| US-08 | Gerenciar Cartões | ✅ PASSOU | qa-US-08-retest-2026-05-20.md |
| US-09 | Pessoas e Splits | ✅ PASSOU | qa-US-09-retest-2026-05-20.md |
| US-10 | Configurações | ✅ PASSOU | qa-US-10-2026-05-20.md |

## Bugs encontrados e corrigidos (ciclo QA completo)

| # | Severidade | US | Arquivo | Bug | Status |
|---|-----------|-----|---------|-----|--------|
| 1 | CRÍTICO | US-01 | `prisma-despesa.repository.ts:26` | `origemId` ausente no `create()` | ✅ Corrigido |
| 2 | CRÍTICO | US-01 | `despesas.routes.ts:53` | `origemId` ausente no Zod `CreateDespesaBody` | ✅ Corrigido |
| 3 | CRÍTICO | US-03 | `investimentos.routes.ts:42` | `app.put` em vez de `app.post` | ✅ Corrigido |
| 4 | CRÍTICO | US-09 | `splits.routes.ts:59` / `finances.module.ts:191` | `deps.createDivisao` undefined em runtime | ✅ Corrigido |
| 5 | MÉDIO | US-10 | `delete-orcamento.use-case.ts:6` | DELETE sem `findById` → Prisma P2025 → 500 | ✅ Corrigido |

## Notas

**US-04 (parcial):** Endpoints REST de faturas/transações OK. `POST /api/intelligence/analyze-pdf` não testado — módulo intelligence aguarda re-review architect para liberação e2e.

**US-07 (estrutural):** Endpoint `POST /api/intelligence/report` estruturalmente correto (domain isolation, cache_control, filtro sintéticos, modelo claude-sonnet-4-6). Teste e2e com IA requer `ANTHROPIC_API_KEY` válida no ambiente — não disponível neste ciclo de teste.

## Critérios de aprovação QA — verificados

- [x] Endpoints respondem com status correto (200/201/204/400/404)
- [x] Schema de resposta bate com contratos Zod nas routes
- [x] Sem double counting em dashboard (split_auto/cartao_ciclo excluídos)
- [x] Soft delete cartão funciona (ativo=false, não remove DB)
- [x] Sentinel id=1 retorna 400 ao tentar deletar
- [x] Rendimento recorrente cria N registros com origemId compartilhado
- [x] DELETE com ?serie=true remove série inteira
- [x] origemId persistido corretamente em despesas
- [x] POST /api/investimentos → 200 (upsert)
- [x] POST /api/divisao → 201 (criar divisão entre pessoas)
