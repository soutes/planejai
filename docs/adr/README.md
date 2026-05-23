# Architecture Decision Records — planejAÍ

Registro das decisões arquiteturais relevantes do projeto.
Novos ADRs seguem o template abaixo e são numerados sequencialmente.
ADRs são **imutáveis** após aceitos. Para superseder: novo número + status "Superseded by ADR-NNNN" no antigo.

## Índice — v1.0 (Streamlit MVP)

| ADR | Título | Status | Data |
|-----|--------|--------|------|
| [ADR-0001](ADR-0001-streamlit-framework.md) | Streamlit como único framework de UI | Superseded by ADR-0008 | 2026-05-15 |
| [ADR-0002](ADR-0002-tres-bancos-sqlite.md) | Separação em 3 bancos SQLite | Superseded by ADR-0011 | 2026-05-15 |
| [ADR-0003](ADR-0003-claude-cli-subprocess.md) | Seleção de provedor de IA pelo usuário | Superseded by ADR-0013 | 2026-05-15 |
| [ADR-0004](ADR-0004-sem-autenticacao-mvp.md) | Sem autenticação no MVP | Accepted | 2026-05-15 |
| [ADR-0005](ADR-0005-design-system-imutavel.md) | Design system como referência imutável | Accepted | 2026-05-15 |
| [ADR-0006](ADR-0006-cartao-ciclo-despesa-sintetica.md) | Total do cartão como despesa sintética | Accepted | 2026-05-15 |
| [ADR-0007](ADR-0007-agente-qa-antes-relator.md) | Pipeline Analista → QA → Relator | Superseded by ADR-0013 | 2026-05-15 |

## Índice — v2.0 (TypeScript rewrite)

| ADR | Título | Status | Data |
|-----|--------|--------|------|
| [ADR-0008](ADR-0008-monorepo-sem-workspaces.md) | Monorepo sem workspaces npm | Accepted | 2026-05-19 |
| [ADR-0009](ADR-0009-fastify-ddd-manual-backend.md) | Fastify 5 + DDD manual no backend | Accepted | 2026-05-19 |
| [ADR-0010](ADR-0010-nextjs-15-app-router-frontend.md) | Next.js 15 App Router no frontend | Accepted | 2026-05-19 |
| [ADR-0011](ADR-0011-prisma-sqlite-local.md) | Prisma + SQLite unificado (offline-first) | Accepted | 2026-05-19 |
| [ADR-0012](ADR-0012-ddd-enxuto-dois-bounded-contexts.md) | DDD enxuto: finances + intelligence | Accepted | 2026-05-19 |
| [ADR-0013](ADR-0013-anthropic-typescript-sdk.md) | Anthropic TypeScript SDK (reescrita agentes) | Accepted | 2026-05-19 |
| [ADR-0014](ADR-0014-sem-deploy-cloud.md) | Execução apenas local — sem Vercel/cloud | Accepted | 2026-05-19 |
| [ADR-0015](ADR-0015-valores-float-reais.md) | Valores monetários em Float (reais, não centavos) | Accepted | 2026-05-19 |

---

## Template

```markdown
# ADR-NNNN: <título>

- **Status:** Accepted | Superseded by ADR-XXXX | Deprecated
- **Data:** YYYY-MM-DD

## Contexto

<Por que essa decisão precisou ser tomada. Forças em jogo, restrições, estado anterior.>

## Decisão

<O que foi decidido, em linguagem afirmativa e direta.>

## Consequências

<O que muda a partir dessa decisão. Trade-offs aceitos, restrições impostas, débitos assumidos.>

## Alternativas consideradas

<Opções avaliadas e por que foram descartadas.>
```
