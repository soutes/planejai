# Prompts de Agent Teams — planejAÍ

> Histórico de todos os agent teams usados no projeto.
> Cada seção é um prompt auto-contido para rodar no Claude Code CLI.

---

## Time 1 — Desenvolvimento inicial (v0.1.0)

> Criou o projeto do zero: schema Prisma, backend Fastify, frontend Next.js, todas as US-01 a US-10.

```
Crie um Agent Team chamado `planejaí-development-team` com 5 agentes rodando em paralelo, que utilizarão o ERD, as User Stories e os ADRs, além do handoff do Claude Design, para desenvolver uma solução completa incluindo backend e frontend. Baseie-se também no arquivo ARQUITETURA.md na raiz do projeto.

**Arquivo de coordenação compartilhado:** todos os agentes leem e escrevem em `docs/status.md` no formato:
| Agente | Módulo | Status | Observação |
Status possíveis: `EM ANDAMENTO` / `CONTRATO PUBLICADO` / `IMPLEMENTADO` / `APROVADO` / `FALHOU`

---

**Agente 1 – Product Owner**
- Name: product-owner-agent
- Responsabilidades:
  - Ler `CLAUDE.md`, `docs/user-stories/README.md` e `docs/user-stories/decisions.md` imediatamente ao iniciar
  - Publicar em `docs/status.md` o status inicial de cada US
  - Ficar disponível para responder dúvidas de escopo dos outros agentes
  - Registrar toda decisão não-trivial em `docs/user-stories/decisions.md`
  - Em conflitos de escopo, a decisão do product-owner-agent é final

**Agente 2 – Architect**
- Name: architect-agent
- Responsabilidades:
  - Ler `ARQUITETURA.md`, `CLAUDE.md`, `docs/adr/README.md` e `docs/erd.md` imediatamente ao iniciar
  - Validar `schema.prisma` e `docs/erd.md` — registrar em `docs/adr/schema-validation.md`
  - Revisar entregas de backend-agent e frontend-agent assim que status = `IMPLEMENTADO`
  - Reportar violações em `docs/adr/review-log.md`
  - Nunca implementar correções. Veredicto: `✅ APROVADO` ou `❌ REPROVADO`

**Agente 2.5 – UI/UX Designer**
- Name: ui-ux-designer-agent
- Responsabilidades:
  - Definir Design System v2.0 em `docs/design/DESIGN_SYSTEM.md`
  - Publicar `docs/design/PAGE_LAYOUTS.md` com wireframes ASCII por página
  - Publicar `docs/design/COMPONENT_SPECS.md`

**Agente 3 – Backend Developer**
- Name: backend-agent
- Responsabilidades:
  - Implementar na ordem: domain entities → repos → use cases → routes → module
  - Publicar contratos em `docs/api-contracts/[módulo].md` antes da implementação completa
  - Regras invioláveis: domain/ nunca importa Fastify/Prisma, HttpError nos use cases, toDomain() inline, mesRef = YYYY-MM

**Agente 4 – Frontend Developer**
- Name: frontend-agent
- Responsabilidades:
  - Iniciar pelos componentes sem dependência de API
  - Monitorar `docs/status.md` — consumir contratos assim que `CONTRATO PUBLICADO`
  - Usar mock tipado enquanto aguarda contrato
  - Server/Client Component sem exceção; apiFetch() exclusivo; lucide-react + recharts

**Agente 5 – QA**
- Name: qa-agent
- Responsabilidades:
  - Testar cada endpoint: happy path, validação 400, 404, integridade referencial
  - Verificar mesRef como YYYY-MM e valores Float
  - Nunca implementar correções — reportar ao lead-agent
  - Output: `docs/qa/qa-[us-id]-[data].md`

**Lead**
- Name: lead-agent
- Responsabilidades:
  - Criar `docs/status.md` com estrutura inicial antes de disparar agentes
  - Disparar todos os 5 agentes simultaneamente
  - Monitorar e desbloquear gargalos
  - Output: `docs/release/0_1_0.md`
```

**Resultado:** v0.1.0 lançado em 2026-05-21. Backend 16/16 APROVADO, Frontend 12/12 APROVADO, QA 10/10 PASSOU.

---

## Time 2 — Visual Refactor (v0.2.0)

> Refactor visual puro — sem novas features, sem mudanças de backend.

```
Crie um Agent Team chamado `planejaí-visual-refactor-team` com 5 agentes rodando em paralelo, dedicados **exclusivamente ao refactor visual** do projeto v2.0.

**Escopo inviolável:**
- ✅ Permitido: tokens CSS, tipografia, componentes visuais, layout, paleta por seção, responsividade
- ❌ Proibido: apps/api/, schema.prisma, erd.md, ADRs, contratos de API, lógica de negócio

**Agente 1 – Product Owner (modo consultor)** — Name: product-owner-agent
Confirma escopo v2 = refactor visual puro. Responde dúvidas em `docs/design/po-answers.md`.

**Agente 2 – Architect (modo guardião)** — Name: architect-agent
Garante que frontend-refactor-agent não toca em apps/api/, schema.prisma, erd.md, ADRs, contratos.
Output: `docs/design/architect-review-log.md`

**Agente 3 – UI/UX Designer (protagonista)** — Name: ui-ux-designer-agent
Paleta por seção: Dashboard #12A09E, Despesas #D93232, Rendimentos #5B996A, Cartão #F2811D, Investimentos #7B6EF5, Gestão #E3F272.
Tipografia Inter 400/500/600/700. Output: DESIGN_SYSTEM.md + PAGE_LAYOUTS.md + COMPONENT_SPECS.md em docs/design/

**Agente 4 – Frontend Refactor (protagonista)** — Name: frontend-refactor-agent
Aguarda ui-ux-designer publicar DESIGN_SYSTEM.md. Atualiza tokens.css, Sidebar 60px icon-only, data-section em 7 páginas.
Preserva 100%: apiFetch(), Server/Client Component, mesRef YYYY-MM, toLocaleString('pt-BR').

**Agente 5 – QA Visual** — Name: qa-visual-agent
Valida paleta, tipografia, responsividade (360/768/1280px), ausência de regressão funcional.
Output: docs/qa/qa-visual-[seção]-[data].md

**Lead** — Name: lead-agent
Output: docs/release/0_2_0_visual.md
```

**Resultado:** v0.2.0-visual lançado em 2026-05-24. Design system flat, section accents, sidebar 60px, 0 regressões.

---

## Time 3 — Invest Refactor (v0.3.0)

> Reestruturação completa do módulo de investimentos: modelo Posição + Movimentações.

```
Crie um Agent Team chamado `planejaí-invest-refactor-team` com 5 agentes rodando em paralelo.

**Novo modelo:**
- Investimento = posição permanente (pessoaId, categoria, instituicao, ativo)
- MovimentacaoInvestimento = evento mensal (investimentoId, mesRef, tipo: APORTE|RENDIMENTO|RESGATE, valor)
- Derivados: saldo_atual, total_investido, total_rendimentos, rentabilidade_pct, evolucao

**Agente 1 – Product Owner** — Name: product-owner-invest-agent
Output: docs/user-stories/invest-refactor.md

**Agente 2 – Architect** — Name: architect-invest-agent
Output: docs/adr/adr-investimentos-v2.md + atualizar docs/erd.md
Projeta schema, migration SQL, interfaces IInvestimentoRepository + IMovimentacaoInvestimentoRepository.

**Agente 3 – Backend** — Name: backend-invest-agent
Aguarda ADR do architect. Implementa na ordem:
schema.prisma → migration SQL → entities → repo interfaces → 8 use cases → repos Prisma → routes → module wiring.
Endpoints: GET/POST/PUT/DELETE posicoes + GET/POST/DELETE movimentacoes + GET evolucao.

**Agente 4 – Frontend** — Name: frontend-invest-agent
Implementa: InvestimentosClient.tsx, EvolucaoChart, DistribuicaoChart, PosicaoForm, MovimentacaoForm.
Usa mock tipado até contratos publicados. Remove MOCK_EVOLUCAO_PATRIMONIO hardcoded.

**Agente 5 – QA** — Name: qa-invest-agent
Output: docs/qa/qa-invest-[data].md

**Lead** — Name: lead-invest-agent
Output: docs/release/invest_v2.md
```

**Resultado:** v0.3.0-invest lançado em 2026-05-27. 8 use cases, 3 novos endpoints, gráficos com dados reais.

---

## Time 4 — Acerto de Contas (v0.4.0)

> Feature nova: US-12 (visualizar saldo acerto mensal) + US-13 (registrar acerto + histórico).
> **Este é o próximo time a rodar.**

### Contexto de negócio

O usuário (pagador principal) lança despesas familiares com splits (ex: aluguel R$2.000, split 50/50 → esposa deve R$1.000). No final do mês, precisa saber o saldo líquido por pessoa e registrar o acerto (Pix). Funciona para grupos com N pessoas.

**Regras críticas:**
- `mesRef` da despesa determina o mês do acerto (não a data de vencimento)
- `somenteMeu=true` nunca entra no acerto
- Acerto parcial distribui valor pelos splits mais antigos primeiro (FIFO por `Despesa.data`)
- Delete de despesa bloqueado se split já coberto por `AcertoDespesaSplit`

### Schema novo (resumo)

```prisma
// Campo novo em DespesaSplit:
valorQuitado Float @default(0)

model AcertoEntry {
  id Int @id @default(autoincrement())
  pessoaId Int; pessoa Pessoa @relation
  mesRef String                    // YYYY-MM do mês sendo acertado
  valor Float
  data String                      // YYYY-MM-DD
  formaPagamento String            // 'pix'|'ted'|'dinheiro'|'outro'
  observacao String?
  criadoEm DateTime @default(now())
  splits AcertoDespesaSplit[]
}

model AcertoDespesaSplit {
  id Int @id @default(autoincrement())
  acertoId Int; acerto AcertoEntry @relation(onDelete: Cascade)
  splitId Int; split DespesaSplit @relation     // onDelete: Restrict
  valorCoberto Float
}
```

### Endpoints novos

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/acerto?mesRef=YYYY-MM&incluirAnteriores=true` | Saldo consolidado por pessoa |
| POST | `/api/acerto` | Registra acerto (cria AcertoEntry + AcertoDespesaSplit + atualiza valorQuitado) |
| DELETE | `/api/acerto/:id` | Reverte acerto (zera valorQuitado dos splits cobertos) |
| GET | `/api/acerto/historico?pessoaId=&mesRefInicio=&mesRefFim=` | Histórico de acertos |

### Endpoints existentes modificados

| Arquivo | Mudança |
|---------|---------|
| `delete-despesa.use-case.ts` | Checar AcertoDespesaSplit antes de deletar → 409 se coberto |
| `despesas.routes.ts` | DespesaSchema: adicionar `valorQuitado` nos splits retornados |
| `get-dashboard.use-case.ts` | Adicionar `saldoAcertoPendente` no response |

### Frontend novo

| Arquivo | Descrição |
|---------|-----------|
| `app/acerto/page.tsx` | Server Component, busca GET /api/acerto |
| `app/acerto/AcertoClient.tsx` | Tabs: Saldo atual / Histórico |
| `app/acerto/AcertoCard.tsx` | Card por pessoa com drill-down (estilo Splitwise) |
| `app/acerto/AcertoModal.tsx` | Modal confirmação: valor editável + forma de pagamento |

### Frontend existente modificado

| Arquivo | Mudança |
|---------|---------|
| `DespesasClient.tsx` | Badge `✓ Acertado` (verde) quando split `valorQuitado >= valorCalculado`; `⏳ Parcial` quando parcial |
| `dashboard/page.tsx` | Widget "Acerto pendente" se `saldoAcertoPendente > 0` |
| `components/layout/Sidebar.tsx` | Link `/acerto` no menu |

```
Crie um Agent Team chamado `planejaí-acerto-team` com 5 agentes rodando em paralelo para implementar a feature de Acerto de Contas (US-12 + US-13).

Leia OBRIGATORIAMENTE antes de qualquer ação:
- CLAUDE.md (regras invioláveis da stack)
- docs/ARQUITETURA.md (estado atual do projeto)
- docs/erd.md (schema atual + novas entidades AcertoEntry + AcertoDespesaSplit)
- docs/user-stories/US-12-visualizar-saldo-acerto-mensal.md
- docs/user-stories/US-13-registrar-acerto-contas.md
- docs/status.md (estado atual de todos os módulos)

**Arquivo de coordenação:** todos os agentes leem e escrevem em `docs/status.md`.
Status: `EM ANDAMENTO` / `CONTRATO PUBLICADO` / `IMPLEMENTADO` / `APROVADO` / `FALHOU`

---

**Agente 1 – Product Owner**
- Name: product-owner-acerto-agent
- Responsabilidades:
  - Confirmar escopo: apenas US-12 e US-13 — não sair disso
  - Responder dúvidas de regra de negócio dos outros agentes (principalmente: FIFO parcial, mesRef de acerto vs vencimento, somenteMeu)
  - Validar se implementações propostas cobrem os critérios de aceite das US
  - Registrar decisões em docs/user-stories/decisions.md

---

**Agente 2 – Architect**
- Name: architect-acerto-agent
- Responsabilidades:
  - Validar schema.prisma após migration (AcertoEntry + AcertoDespesaSplit + valorQuitado em DespesaSplit)
  - Confirmar que docs/erd.md está em sync com schema.prisma
  - Revisar entregas de backend-acerto-agent e frontend-acerto-agent
  - Garantir: domain/ nunca importa Prisma/Fastify, HttpError nos use cases, toDomain() inline
  - Output: docs/adr/acerto-review-log.md
  - Nunca implementar — apenas revisar e aprovar/reprovar

---

**Agente 3 – Backend**
- Name: backend-acerto-agent
- Responsabilidades:
  1. **Migration Prisma:**
     - Adicionar campo `valorQuitado Float @default(0)` em `DespesaSplit`
     - Criar model `AcertoEntry` (pessoaId, mesRef, valor, data, formaPagamento, observacao, criadoEm, splits[])
     - Criar model `AcertoDespesaSplit` (acertoId CASCADE, splitId RESTRICT, valorCoberto)
     - Rodar `npx prisma migrate dev --name acerto_entry`
  2. **Domain entities:** `apps/api/src/modules/finances/domain/entities/Acerto.ts`
     - Interfaces: SaldoPessoa, AcertoEntry, HistoricoAcerto, CreateAcertoInput
  3. **Repository interface:** `IAcertoRepository.ts`
  4. **Use cases:**
     - `CalcularAcertoUseCase` — agrega DespesaSplit por pessoa, subtrai DivisaoEntry a_pagar abertas
     - `RegistrarAcertoUseCase` — cria AcertoEntry + AcertoDespesaSplit + atualiza valorQuitado (FIFO)
     - `DeleteAcertoUseCase` — reverte valorQuitado dos splits cobertos
     - `ListarHistoricoAcertoUseCase` — lista AcertoEntry com joins
  5. **Prisma repo:** `prisma-acerto.repository.ts` — toDomain() inline
  6. **Routes:** `acerto.routes.ts` — 4 endpoints com Zod schemas
  7. **Modificar** `DeleteDespesaUseCase` — checar AcertoDespesaSplit antes de deletar, lançar HttpError 409
  8. **Modificar** `despesas.routes.ts` — incluir valorQuitado no DespesaSchema
  9. **Modificar** `GetDashboardUseCase` — adicionar campo saldoAcertoPendente
  10. **Modificar** `finances.module.ts` — registrar novos use cases + acerto.routes.ts
  - Publicar contrato em `docs/api-contracts/acerto.md` antes da implementação completa
  - Garantir `tsc --noEmit` zero erros antes de marcar IMPLEMENTADO
  - Regras: domain/ nunca importa Fastify/Prisma, HttpError, toDomain() inline, mesRef YYYY-MM, valores Float

---

**Agente 4 – Frontend**
- Name: frontend-acerto-agent
- Responsabilidades:
  1. **Aguardar** contrato em `docs/api-contracts/acerto.md` (status CONTRATO PUBLICADO)
  2. **Novos arquivos:**
     - `apps/web/src/app/acerto/page.tsx` — Server Component (PageHeader + busca GET /api/acerto)
     - `apps/web/src/app/acerto/AcertoClient.tsx` — Client, tabs Saldo atual / Histórico
     - `apps/web/src/app/acerto/AcertoCard.tsx` — card por pessoa: nome, saldo total, direção, lista despesas expandível
     - `apps/web/src/app/acerto/AcertoModal.tsx` — modal: valor (editável), data, formaPagamento (select), observacao
  3. **Modificar** `apps/web/src/components/layout/Sidebar.tsx` — adicionar link /acerto (ícone: HandCoins do lucide-react)
  4. **Modificar** `apps/web/src/app/despesas/DespesasClient.tsx`:
     - Na tabela, coluna Valor: adicionar badge `✓` (verde) quando split.valorQuitado >= split.valorCalculado
     - Badge `½` (amarelo) quando valorQuitado > 0 e < valorCalculado
     - A API já retorna valorQuitado no split — consumir do response sem nova chamada
  5. **Modificar** `apps/web/src/app/dashboard/page.tsx`:
     - Adicionar widget "Acerto pendente" se DashboardData.saldoAcertoPendente > 0
     - Mostrar valor total + botão "Ver acerto" → /acerto
  6. Usar `--section-invest` (`#10F5A3`) como accent da seção (verde = positivo/recebimento)
  7. `data-section="acerto"` no container root de AcertoClient
  8. Preservar exatamente: apiFetch(), Server/Client Component, useMesRef(), mesRef YYYY-MM
  9. `npm run build` zero erros antes de marcar IMPLEMENTADO

---

**Agente 5 – QA**
- Name: qa-acerto-agent
- Responsabilidades:
  - Aguardar módulos com status APROVADO pelo architect-acerto-agent
  - Testar endpoints:
    - GET /api/acerto?mesRef=YYYY-MM — resposta com array SaldoPessoa, somenteMeu excluído
    - GET /api/acerto?incluirAnteriores=true — inclui splits de meses anteriores não quitados
    - POST /api/acerto — cria AcertoEntry + AcertoDespesaSplit + atualiza valorQuitado
    - POST /api/acerto (parcial) — FIFO: split mais antigo quitado primeiro
    - DELETE /api/acerto/:id — reverte valorQuitado corretamente
    - GET /api/acerto/historico — filtrável por pessoaId e intervalo mesRef
    - DELETE /api/despesas/:id com split em AcertoDespesaSplit → deve retornar 409
  - Verificar frontend:
    - Badge ✓ aparece em despesas cujo split está totalmente quitado
    - Badge ½ aparece em acerto parcial
    - Widget "Acerto pendente" no dashboard quando saldoAcertoPendente > 0
    - Modal aceita valor editável antes de confirmar
    - Sidebar tem link /acerto
  - Nunca implementar correções — reportar ao lead-acerto-agent
  - Output: docs/qa/qa-acerto-[data].md

---

**Lead**
- Name: lead-acerto-agent
- Responsabilidades:
  - Ler docs/status.md e verificar estado atual do projeto antes de disparar agentes
  - Criar seção "Acerto de Contas" em docs/status.md
  - Disparar todos os 5 agentes simultaneamente
  - Dependência crítica: frontend-acerto-agent pode iniciar com mock enquanto aguarda contrato do backend
  - Garantir que docs/erd.md fica em sync após migration
  - Encerrar quando US-12 e US-13 estiverem APROVADO em docs/status.md
  - Output: docs/release/0_4_0_acerto.md
```

---

## Guia de execução com tmux

Ver arquivo `docs/tmux-acerto.sh` para script de execução paralela.
