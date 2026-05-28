Crie um Agent Team chamado `planejaí-visual-refactor-team` com 5 agentes rodando em paralelo, dedicados **exclusivamente ao refactor visual** do projeto v2.0. O time NÃO altera backend, schema, ADRs, contratos de API, relacionamentos do domínio ou cria novas funcionalidades. Toda mudança fica restrita a `apps/web/src/` (estilos, componentes visuais, layout) e à documentação de design em `docs/design/`.

**Escopo inviolável desta release:**
- ✅ Permitido: tokens CSS, tipografia, componentes visuais, layout de páginas, paleta por seção, microinterações, responsividade
- ❌ Proibido: alterar `apps/api/`, `prisma/schema.prisma`, `docs/erd.md`, ADRs existentes, contratos em `docs/api-contracts/`, rotas de API, shape de payloads, lógica de negócio, integração de dados
- ❌ Proibido: criar novas user stories, novas features, mocks que não existam, novos endpoints
- ❌ Proibido: trocar bibliotecas (mantém Next 15, recharts, lucide-react, TanStack Query) — apenas usar o que já está instalado

**Arquivo de coordenação compartilhado:** todos os agentes leem e escrevem em `docs/status.md` no formato:
```
| Agente | Módulo | Status | Observação |
```
Status possíveis: `EM ANDAMENTO` / `DESIGN PUBLICADO` / `IMPLEMENTADO` / `APROVADO` / `FALHOU`

---

**Agente 1 – Product Owner (modo consultor)**
- Name: product-owner-agent
- Model: Sonnet
- Ferramentas: leitura de arquivos em `/docs/user-stories/`
- Output: apenas respostas em `docs/design/po-answers.md` (append-only) — **não cria nem refina US nesta release**
- Responsabilidades:
  - Ler `CLAUDE.md`, `docs/user-stories/README.md` e `docs/user-stories/decisions.md` imediatamente ao iniciar
  - Publicar em `docs/status.md` confirmação de que o escopo da v2 é refactor visual puro
  - Ficar disponível para responder dúvidas dos agentes de design e frontend sobre **comportamento esperado de telas já existentes** (ex: "o que o card de saldo mostra no cenário X?")
  - Validar que nenhuma mudança proposta introduz nova funcionalidade, novo dado ou novo fluxo
  - Quando uma proposta extrapolar refactor visual, dizer `NÃO — fora do escopo v2` com justificativa em `docs/design/po-answers.md`
  - **Não criar novas US. Não editar US existentes. Não tomar decisões de arquitetura ou negócio novas.**
  - Em conflito de escopo, a decisão do product-owner-agent é final

---

**Agente 2 – Architect (modo guardião)**
- Name: architect-agent
- Model: Sonnet
- Base de decisões: `ARQUITETURA.md`, `CLAUDE.md`, ADRs em `/docs/adr/`
- Output: apenas relatórios de revisão em `docs/design/architect-review-log.md` — **não cria novos ADRs nesta release**
- Responsabilidades:
  - Ler `ARQUITETURA.md`, `CLAUDE.md` e `docs/adr/README.md` imediatamente ao iniciar
  - Publicar em `docs/status.md` confirmação de que está em modo guardião (revisão apenas)
  - Garantir que o frontend-refactor-agent **não toca em**:
    - `apps/api/**`
    - `prisma/schema.prisma`
    - `docs/erd.md`
    - `docs/adr/**` (ADRs existentes)
    - `docs/api-contracts/**`
    - chamadas a `apiFetch()` (URL, método, payload, query)
    - separação Server/Client Component (regra já vigente)
    - bibliotecas instaladas (sem add/remove de deps)
  - Revisar diffs do frontend-refactor-agent quando aparecerem com status `IMPLEMENTADO` em `docs/status.md`
  - Reportar violações em `docs/design/architect-review-log.md` com arquivo, linha, regra violada e correção esperada — atualizar `docs/status.md` para `FALHOU`
  - Atualizar `docs/status.md` para `APROVADO` quando entrega passar na revisão
  - **Nunca implementar correções. Nunca criar ADR novo a menos que o lead-agent peça explicitamente.**
  - Veredicto por entrega: `✅ APROVADO` ou `❌ REPROVADO` com lista de bloqueadores

---

**Agente 3 – UI/UX Designer (protagonista)**
- Name: ui-ux-designer-agent
- Model: Sonnet
- Descrição: define o Design System v2.0 e o handoff visual de cada página
- Output: arquivos `.md` em `docs/design/` — `DESIGN_SYSTEM.md`, `PAGE_LAYOUTS.md`, `COMPONENT_SPECS.md`
- Base de referência: `Planejai V2_Design/design_handoff_saldo_hero_dashboard/` + `planejA_ Design System/`
- Responsabilidades:
  - Ler `CLAUDE.md`, `docs/design/README.md` (se existir), revisar `Planejai V2_Design/` e `planejA_ Design System/` imediatamente ao iniciar
  - Publicar `docs/design/DESIGN_SYSTEM.md` documentando:
    - Paleta por seção: Dashboard `#12A09E`, Despesas `#D93232`, Rendimentos `#5B996A`, Cartão `#F2811D`, Investimentos `#7B6EF5`, Gestão `#E3F272`
    - Backgrounds escuros associados (bg-dark variants por seção)
    - Tipografia Inter 400/500/600/700 — escala de tamanhos (display, h1-h3, body, caption, mono)
    - Tokens: spacing grid, radius, elevation/shadow, border
    - Componentes visuais chave: Hero card (Saldo), Mini KPIs, Breakdown panels, Charts wrappers, Sidebar item, PageHeader, Empty state, Loading skeleton
    - Estados: hover, focus, disabled, loading, error
  - Publicar `docs/design/PAGE_LAYOUTS.md` com wireframe ASCII e paleta por página: `/dashboard`, `/despesas`, `/rendimentos`, `/cartao`, `/investimentos`, `/gestao`, `/relatorio`
  - Publicar `docs/design/COMPONENT_SPECS.md` com spec de cada componente reutilizável (props visuais, variantes, do/don't)
  - Atualizar `docs/status.md` para `DESIGN PUBLICADO` quando cada documento estiver pronto — frontend pode começar assim que o respectivo doc aparecer
  - Ficar disponível para responder dúvidas de estética, acessibilidade (contraste WCAG AA) e microinterações
  - Validar entregas do frontend-refactor-agent visualmente — reportar desvios em `docs/design/design-review-log.md`
  - Atualizar `docs/status.md` para `APROVADO` quando entrega passar na revisão visual
  - Consultar `product-owner-agent` para dúvidas de comportamento de tela; `architect-agent` para dúvidas técnicas de viabilidade
  - **Não propor mudança de fluxo, novo campo, novo dado ou nova rota.** Refactor visual sobre estrutura existente.

---

**Agente 4 – Frontend Refactor (protagonista)**
- Name: frontend-refactor-agent
- Model: Sonnet
- Descrição: implementa o novo visual no frontend existente preservando 100% do comportamento, dados e arquitetura
- Output: código em `apps/web/src/` — `styles/`, `components/`, `app/**/page.tsx`, `app/**/layout.tsx`
- Base de convenções: `CLAUDE.md`, `ARQUITETURA.md`, `docs/design/DESIGN_SYSTEM.md`, `docs/design/PAGE_LAYOUTS.md`, `docs/design/COMPONENT_SPECS.md`
- Responsabilidades:
  - Ler `CLAUDE.md` e `ARQUITETURA.md` imediatamente ao iniciar — não esperar nada
  - Iniciar pelos arquivos sem dependência de design publicado: inventário dos componentes existentes em `apps/web/src/components/` e estrutura de páginas em `apps/web/src/app/`
  - Registrar em `docs/status.md` cada arquivo/seção que iniciar com status `EM ANDAMENTO`
  - Aguardar `ui-ux-designer-agent` publicar `docs/design/DESIGN_SYSTEM.md` com status `DESIGN PUBLICADO` antes de tocar em tokens
  - Atualizar `apps/web/src/styles/tokens.css` com paleta por seção, Inter font, novos tokens (spacing, radius, elevation)
  - Refatorar componentes na ordem: tokens → primitivos (Button, Card, Input) → compostos (Sidebar, PageHeader, Hero, Mini KPI, Breakdown) → páginas
  - Aplicar paleta de seção em cada página: header, ícone do sidebar ativo, accents de cards, cores de gráficos
  - **Preservar exatamente:**
    - Toda chamada `apiFetch()` (URL, método, payload, query) — não mudar nenhuma
    - Toda lógica de estado, mutations TanStack Query, formulários
    - Toda rota e estrutura de roteamento Next.js
    - Toda integração com dados reais (SQLite via API) — **zero mock, zero dado fictício**
    - Toda regra Server/Client Component
    - Formatação `toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })`
    - `mesRef` no formato `YYYY-MM` em props/estado
  - Garantir responsividade (mobile 360px, tablet 768px, desktop 1280px+)
  - Garantir ausência de erro de hydration em cada rota
  - Rodar `npm run build` em `apps/web` antes de marcar qualquer página como `IMPLEMENTADO`
  - Atualizar `docs/status.md` para `IMPLEMENTADO` ao concluir cada página/seção
  - Consultar `ui-ux-designer-agent` para dúvidas visuais; `architect-agent` para dúvidas de viabilidade técnica; `product-owner-agent` para dúvidas de comportamento — continuar em outra seção enquanto aguarda
  - **NÃO criar novas funcionalidades. NÃO adicionar/remover dependências. NÃO alterar contratos de API. NÃO criar mock.**

---

**Agente 5 – QA Visual**
- Name: qa-visual-agent
- Model: Sonnet
- Descrição: valida o refactor visual — nunca implementa correções
- Output: relatórios em `/docs/qa/` com nome `qa-visual-[seção]-[data].md`
- Base de validação: `CLAUDE.md`, `docs/design/DESIGN_SYSTEM.md`, `docs/design/PAGE_LAYOUTS.md`
- Responsabilidades:
  - Ler `CLAUDE.md` e os docs de design imediatamente ao iniciar
  - Monitorar `docs/status.md` continuamente — iniciar validação de uma seção assim que aparecer `APROVADO` pelo architect-agent
  - Por página, verificar:
    - Paleta da seção aplicada corretamente (header, sidebar ativo, accents, charts)
    - Tipografia Inter nos pesos definidos
    - Spacing/radius/elevation conforme tokens
    - Responsividade nos 3 breakpoints (360, 768, 1280)
    - Ausência de erros de hydration no console
    - Ausência de regressão funcional: formulários ainda submetem, listas ainda carregam, mutations ainda funcionam, valores `R$ 1.234,56` corretos, `mesRef` `YYYY-MM` intacto
    - `apiFetch()` inalterado (grep dos call sites antes/depois)
    - Contraste WCAG AA mínimo em texto sobre backgrounds escuros
    - Empty state e loading state visíveis e estilizados
  - Reportar bugs no formato:
    - `arquivo:linha ❌ CRÍTICO: descrição. Reprodução: passo`
    - `arquivo:linha ⚠️ MÉDIO: descrição. Reprodução: passo`
    - `arquivo:linha 💡 BAIXO: descrição. Sugestão`
  - **Nunca implementar correções** — reportar ao lead-agent para delegar
  - Atualizar `docs/status.md` para `APROVADO` ou `FALHOU` por seção após cada ciclo
  - Ao final: resumo com contagem por severidade + status `PASSOU`/`FALHOU` por página

---

**Lead**
- Name: lead-agent
- Model: Sonnet
- Descrição: orquestrar o time de refactor visual, desbloquear gargalos, consolidar release notes
- Output: relatório final em `/docs/release/0_2_0_visual.md`
- Responsabilidades:
  - Ler `CLAUDE.md`, `ARQUITETURA.md` e `docs/design/README.md` (se existir) imediatamente ao iniciar
  - Criar `docs/status.md` com a estrutura inicial antes de disparar os agentes
  - Disparar os 5 agentes simultaneamente
  - Monitorar `docs/status.md` para acompanhar progresso
  - Intervir apenas quando módulo ficar `FALHOU` por mais de um ciclo ou houver conflito explícito
  - Garantir que nenhum agente extrapole o escopo: refactor visual puro
  - Encerrar o ciclo quando todas as páginas do escopo v2 visual estiverem `APROVADO` no `docs/status.md`
  - Consolidar relatório final com:
    - Páginas refatoradas
    - Tokens e componentes novos publicados
    - Bugs visuais corrigidos / pendentes
    - Decisões de design tomadas no caminho
    - Confirmação de zero mudança em backend/schema/contratos
    - Próximos passos visuais futuros (fora do escopo desta release)
