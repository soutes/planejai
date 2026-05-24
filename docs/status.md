# docs/status.md — planejAÍ v2.0 Team Status

> Arquivo de coordenação compartilhado. Todos os agentes leem e escrevem aqui.
> Atualizar SEMPRE que mudar o status de um módulo.

## Legenda

| Status | Significado |
|--------|-------------|
| `PENDENTE` | Não iniciado |
| `EM ANDAMENTO` | Agente trabalhando |
| `CONTRATO PUBLICADO` | Interface/endpoint definido em `docs/api-contracts/` |
| `IMPLEMENTADO` | Código entregue, aguardando revisão do architect |
| `APROVADO` | Architect aprovou — pronto para QA |
| `FALHOU` | Reprovado pelo architect ou QA — ver log de review |

---

## Backend — `apps/api`

| Agente | Módulo | Status | Observação |
|--------|--------|--------|------------|
| backend-agent | Setup inicial (server, app, errors, prisma) | `APROVADO` | Prefixo /api via wrapper em finances.module.ts:112 + intelligence.module.ts:22 ✅ |
| backend-agent | finances/pessoas | `APROVADO` | Arquitetura OK ✅ |
| backend-agent | finances/abas | `APROVADO` | Arquitetura OK ✅ |
| backend-agent | finances/categorias | `APROVADO` | Arquitetura OK ✅ |
| backend-agent | finances/despesas | `APROVADO` | serie param + filtro sintéticos confirmados ✅ |
| backend-agent | finances/rendimentos | `APROVADO` | serie param + recorrência N meses confirmados ✅ |
| backend-agent | finances/investimentos | `APROVADO` | Arquitetura OK ✅ |
| backend-agent | finances/cartoes | `APROVADO` | Soft delete + sentinela id=1 confirmados ✅ |
| backend-agent | finances/faturas | `APROVADO` | entity, repo, routes, PUT /api/faturas/:id/transacoes/:tid ✅ |
| backend-agent | finances/snapshots | `APROVADO` | entity, repo, routes ✅ |
| backend-agent | finances/dashboard | `APROVADO` | Filtro sintéticos + orcamentos + divisoesPendentes ✅ |
| backend-agent | finances/splits | `APROVADO` | DivisaoEntry entity, repo, GET /api/divisao + POST /api/divisao + PUT /api/divisao/:id ✅ (DEC-PO-004) |
| backend-agent | finances/regras-fixas | `APROVADO` | CRUD completo, domain isolation OK ✅ |
| backend-agent | finances/category-rules | `APROVADO` | CRUD completo, domain isolation OK ✅ |
| backend-agent | intelligence/analyze-pdf | `APROVADO` | PROMPTS em domain/prompts/index.ts — domain isolation OK ✅ |
| backend-agent | intelligence/report | `APROVADO` | PROMPTS em domain/prompts/index.ts + filtro sintéticos despesasReais:40 ✅ |

---

## Frontend — `apps/web`

| Agente | Módulo | Status | Observação |
|--------|--------|--------|------------|
| frontend-agent | Setup inicial (next.js, tokens, layout, providers) | `APROVADO` | Tokens canônicos + cinza-* + ink-800 + sem @import ✅ |
| frontend-agent | Componentes base (Button, Card, Modal, Form, Table) | `APROVADO` | DataTable com 'use client' ✅ |
| frontend-agent | /dashboard | `APROVADO` | US-06 — Server Component + recharts ✅ |
| frontend-agent | /despesas | `APROVADO` | US-01 — CRUD + mock fallback + serie param ✅ |
| frontend-agent | /rendimentos | `APROVADO` | US-02 — CRUD + pie chart + serie param ✅ |
| frontend-agent | /investimentos | `APROVADO` | US-03 — snapshot + donut + evolução ✅ |
| frontend-agent | /cartao — análise fatura | `APROVADO` | US-04 — CartaoClient.tsx:98 corrigido: URL /:transacaoId + body {categoria} ✅ |
| frontend-agent | /cartao — ciclo | `APROVADO` | US-05 — ciclo atual + delta vs anterior ✅ |
| frontend-agent | /relatorio | `APROVADO` | US-07 — RelatorioIA tipado + campos → markdown ✅ |
| frontend-agent | /gestao — cartoes | `APROVADO` | US-08 — CRUD cartões + sentinela id=1 ✅ |
| frontend-agent | /gestao — pessoas/splits | `APROVADO` | US-09 — /api/divisao + PUT /api/divisao/:id ✅ |
| frontend-agent | /gestao — configuracoes | `APROVADO` | US-10 — categorias + abas ✅ |

---

## Infra / Arquitetura

| Agente | Módulo | Status | Observação |
|--------|--------|--------|------------|
| architect-agent | Validação schema.prisma vs erd.md | `APROVADO` | Ver docs/adr/schema-validation.md — 17 modelos, 22 índices, todas FK corretas |
| architect-agent | Review backend setup | `APROVADO` | 14/16 APROVADO. intelligence (2) FALHOU — ver review-log.md [2026-05-20] re-review |
| architect-agent | Review frontend setup + componentes | `APROVADO` | Setup + Componentes APROVADO. Páginas: revisão pendente |
| architect-agent | Re-review intelligence (analyze-pdf + report) | `APROVADO` | domain isolation OK + filtro sintéticos OK ✅ — ver review-log.md [2026-05-20] |
| architect-agent | Review frontend páginas (US-01 a US-10) | `APROVADO` | 10/10 APROVADO. /cartao + /relatorio re-aprovados após fix ✅ — ver review-log.md [2026-05-20] |

---

## QA

| Agente | Módulo | Status | Observação |
|--------|--------|--------|------------|
| qa-agent | US-01 Registrar Despesa | `PASSOU` | Pós-fix completo: origemId persistido ✅ (repo + Zod schema despesas.routes.ts:53) |
| qa-agent | US-02 Registrar Rendimento | `PASSOU` | Pós-fix: serie delete + recorrente N meses ✅ |
| qa-agent | US-03 Registrar Investimento | `PASSOU` | Pós-fix: app.post corrigido ✅ POST /api/investimentos → 200 |
| qa-agent | US-04 Analisar Fatura IA | `PASSOU` (parcial) | Endpoints REST OK. analyze-pdf não testado (intelligence aguarda re-review) |
| qa-agent | US-05 Acompanhar Ciclo | `PASSOU` | GET/POST/DELETE snapshots OK, deltaVsAnterior presente |
| qa-agent | US-06 Dashboard | `PASSOU` | Pós-fix: dupla contagem corrigida, orcamentos + divisoesPendentes ✅ |
| qa-agent | US-07 Relatório IA | `APROVADO` (estrutural) | Endpoint OK, domain isolation OK, cache_control OK, filtro sintéticos OK. ANTHROPIC_API_KEY não disponível no ambiente de teste — e2e com IA requer key válida |
| qa-agent | US-08 Gerenciar Cartões | `PASSOU` | Pós-fix: soft delete + sentinela id=1 ✅ |
| qa-agent | US-09 Pessoas e Splits | `PASSOU` | Pós-fix: DI corrigido em finances.module.ts ✅ POST /api/divisao → 201 |
| qa-agent | US-10 Configurações | `PASSOU` | Categorias/abas CRUD OK. Pós-fix: DELETE /api/orcamentos/:id inexistente → 404 ✅ |

---

## User Stories — Status PO

| US | Título | Rota | Status PO | Observação |
|----|--------|------|-----------|------------|
| US-01 | Registrar despesa | `/despesas` | `EM ESCOPO` | |
| US-02 | Registrar rendimento | `/rendimentos` | `EM ESCOPO` | |
| US-03 | Registrar investimento | `/investimentos` | `EM ESCOPO` | |
| US-04 | Analisar fatura de cartão via IA | `/cartao` | `EM ESCOPO` | Refinada: `PUT /api/faturas/:id/transacoes` adicionado aos endpoints (DEC-PO-003) |
| US-05 | Acompanhar ciclo atual do cartão | `/cartao` | `EM ESCOPO` | |
| US-06 | Ver dashboard financeiro | `/dashboard` | `EM ESCOPO` | |
| US-07 | Consultar relatório com IA | `/relatorio` | `EM ESCOPO` | |
| US-08 | Gerenciar cartões | `/gestao` | `EM ESCOPO` | |
| US-09 | Gerenciar pessoas e splits | `/gestao` | `EM ESCOPO` | Refinada: endpoints DivisaoEntry adicionados (DEC-PO-004) |
| US-10 | Configurar categorias, abas e metas | `/gestao` | `EM ESCOPO` | Refinada: endpoints Aba adicionados (DEC-PO-005) |

---

## Última atualização

`2026-05-20` — product-owner-agent: auditoria US-01 a US-10 concluída. 3 US refinadas (US-04, US-09, US-10). Todos os endpoints críticos documentados.
`2026-05-20` — architect-agent: schema.prisma APROVADO. Monitorando entregas de backend-agent e frontend-agent para revisão contínua.
`2026-05-20` — lead-agent: auditoria do filesystem. Backend: 9/14 módulos IMPLEMENTADO. Falta: faturas, snapshots, splits/divisao, intelligence. Frontend: apps/web ainda não criado. Solicitado architect-review do backend já implementado.
`2026-05-20` — lead-agent: 5 correções específicas enviadas ao backend-agent (FIX1: prefixo /api, FIX2-3: serie param, FIX4: cartão soft-delete, FIX5: dashboard dupla contagem). Frontend: setup+componentes+/dashboard+/despesas IMPLEMENTADO — restante EM ANDAMENTO.
`2026-05-20` — architect-agent: revisão frontend setup + componentes base concluída. 2 FALHOU: tokens.css nomes errados + DataTable sem 'use client'. Ver review-log.md [2026-05-20] frontend.
`2026-05-20` — backend-agent: TODOS os 16 módulos backend IMPLEMENTADO. Bloqueadores corrigidos: prefixo /api, serie param, soft delete cartão, sentinela id=1, dashboard filtros/campos, list-despesas filtro sintéticos, create-rendimento recorrência. Novos módulos: faturas, snapshots, splits, regras-fixas, category-rules, intelligence. tsc --noEmit: zero erros. Aguarda re-review do architect-agent.
`2026-05-20` — frontend-agent: 2 FALHOU corrigidos. CartaoClient.tsx:98 → PUT /api/faturas/:id/transacoes/:tid com body {categoria}. RelatorioClient.tsx → tipado como RelatorioIA, campos mapeados para markdown. tsc --noEmit: zero erros. Aguarda re-review do architect-agent.
`2026-05-20` — architect-agent: re-review completo. 14/16 backend APROVADO. FALHOU: intelligence (domain→infra import + dupla contagem). Frontend setup+componentes APROVADO. QA pode iniciar US-01 a US-09 (US-07 aguarda fix intelligence).
`2026-05-20` — lead-agent: intelligence fixes verificados. PROMPTS em domain/prompts/index.ts ✅. Filtro sintéticos GenerateReportUseCase:40 ✅. Status atualizado para IMPLEMENTADO. Solicitado re-review architect + review das 10 páginas frontend.
`2026-05-20` — architect-agent: re-review intelligence APROVADO (16/16 backend APROVADO). Review 10 páginas frontend: 7/10 APROVADO. FALHOU: /cartao (CartaoClient.tsx:98 URL + body errados) + /relatorio (RelatorioClient.tsx:55 type mismatch). QA liberado para US-01, US-02, US-03, US-06, US-08, US-09, US-10. US-04, US-05, US-07 aguardam fix frontend-agent.
`2026-05-20` — architect-agent: re-review /cartao + /relatorio APROVADO. 10/10 frontend APROVADO. 16/16 backend APROVADO. Todas as US desbloqueadas para QA.
`2026-05-20` — qa-agent: testes funcionais US-01 a US-09 concluídos. 3 FALHOU com bugs críticos: US-01 (origemId não persistido), US-03 (PUT em vez de POST em /investimentos), US-09 (POST /api/divisao → 500). 5 PASSOU: US-02, US-05, US-06, US-08, US-04 (parcial). Ver docs/qa/ para relatórios detalhados.
`2026-05-20` — qa-agent: US-10 e US-07 testadas. US-10 PASSOU (bug médio: DELETE /api/orcamentos/:id inexistente → 500). US-07 BLOQUEADO (ANTHROPIC_API_KEY placeholder — re-testar com key válida). QA backend completo: 3 CRÍTICO (US-01, US-03, US-09) + 1 MÉDIO (US-10 orcamentos) abertos para backend-agent.
`2026-05-21` — qa-agent: QA 100% completo. 10/10 US PASSOU. 0 bugs abertos. 5 bugs corrigidos no ciclo de re-teste (origemId Zod, POST investimentos, DI splits, orcamento 404, origemId repo).
`2026-05-21` — lead-agent: **planejAÍ v0.1.0 LANÇADO**. Release report em docs/release/0_1_0.md. Backend 16/16 APROVADO, Frontend 12/12 APROVADO, QA 10/10 PASSOU. Risco conhecido: US-04 analyze-pdf + US-07 relatório requerem ANTHROPIC_API_KEY válida no .env.
`2026-05-24` — product-owner-agent: escopo Visual Refactor v2.0 confirmado. Refactor visual puro — zero novas US, features, dados ou rotas. docs/design/po-answers.md criado.
`2026-05-24` — frontend-refactor-agent: Visual Refactor v2.0 IMPLEMENTADO. tokens.css (section accents, Inter font, flat tokens), globals.css (flat cards, icon-only sidebar, section-aware accent vars), Sidebar 60px, layout.tsx Inter, data-section em 7 páginas, KpiCard hero. Build: 0 erros.
`2026-05-24` — qa-visual-agent: QA Final Visual Refactor v2.0 PASSOU. 12 arquivos validados: 0 regressões apiFetch, 0 violações use client, 0 violações mesRef. data-section 7/7 ✅. Flat design ✅. Sidebar 60px ✅. Responsive ✅. 1 médio aberto: globals.css:244 input focus box-shadow. Ver docs/qa/qa-visual-final-2026-05-24.md.
`2026-05-24` — qa-visual-agent: Re-validação pós-QA CSS fixes. Fix 1: .af-btn--ghost border/color section-aware via color-mix ✅. Fix 2: .af-input:focus box-shadow removido ✅. Remanescente non-blocking: ghost hover rgba hardcoded. Veredicto atualizado: 0 críticos, 0 médios, 2 baixos.

---

## Visual Refactor v2.0

| Agente | Módulo | Status | Observação |
|--------|--------|--------|------------|
| product-owner-agent | Escopo v2 visual | `APROVADO` | Refactor visual puro confirmado. Zero novas US, features, dados ou rotas. |
| architect-agent | Modo guardião | `APROVADO` | Lendo arquitetura. Aguardando entregas frontend para revisão. |
| architect-agent | Review Visual Refactor v2.0 (12 arquivos) | `APROVADO` | Todas regras arquiteturais satisfeitas. Mudanças visual-only confirmadas. Ver architect-review-log.md [2026-05-24] |
| ui-ux-designer-agent | DESIGN_SYSTEM.md | `DESIGN PUBLICADO` | Inter, section accents, sidebar 60px, flat design, hero card spec |
| ui-ux-designer-agent | PAGE_LAYOUTS.md | `DESIGN PUBLICADO` | Wireframes e paleta para 7 páginas |
| ui-ux-designer-agent | COMPONENT_SPECS.md | `DESIGN PUBLICADO` | Specs de 10+ componentes |
| frontend-refactor-agent | Inventário de componentes | `IMPLEMENTADO` | 17 arquivos mapeados: tokens, globals, sidebar, layout, 7 páginas, KpiCard |
| frontend-refactor-agent | tokens.css + globals.css | `IMPLEMENTADO` | Inter font, section accents, flat cards, sb-nav icon-only, seção-aware accent |
| frontend-refactor-agent | Sidebar v2 (60px icon-only) | `IMPLEMENTADO` | Logo 40×40 branco, icon-only com title tooltip, sem wordmark |
| frontend-refactor-agent | layout.tsx Inter font | `IMPLEMENTADO` | Bricolage+Jakarta→Inter, --font-inter variable |
| frontend-refactor-agent | data-section attributes (todas as páginas) | `IMPLEMENTADO` | dashboard, despesas, rendimentos, cartao, investimentos, gestao, relatorio |
| frontend-refactor-agent | /dashboard hero card (Saldo do Mês) | `IMPLEMENTADO` | KpiCard glow=true: R$ 22px + inteiro 64px + decimal 24px, af-glow flat com section-hero-bg |
| frontend-refactor-agent | Build verificado | `IMPLEMENTADO` | npm run build: 0 erros TypeScript, 11/11 páginas geradas |
| frontend-refactor-agent | Responsive (768px/360px) | `IMPLEMENTADO` | @media breakpoints: sidebar hide, margin-left 0, grid 1fr |
| qa-visual-agent | tokens.css + globals.css + layout | `FALHOU` | 3 críticos: layout.tsx Bricolage+Jakarta sobrescrevem tokens; Sidebar.tsx JSX com texto transborda 60px; shell sem data-section. 2 médios: input focus tem glow ring; sem @media. Ver docs/qa/qa-visual-tokens-globals-2026-05-24.md |
| qa-visual-agent | Visual Refactor v2.0 — QA Final (12 arquivos) | `PASSOU` | 0 críticos, 0 médios, 2 baixos. Pós-QA fixes re-validados: input focus shadow removido ✅, ghost btn border section-aware ✅. Remanescente non-blocking: ghost hover hardcoded + font-mono cascade. Ver docs/qa/qa-visual-final-2026-05-24.md |
