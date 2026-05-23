# ADR-0008: Monorepo sem workspaces npm

- **Status:** Accepted
- **Data:** 2026-05-19
- **Decisores:** dev

## Contexto

O projeto v2.0 tem dois artefatos distintos: o frontend Next.js (`apps/web`) e o backend Fastify (`apps/api`). A escolha de como organizar esses dois projetos num único repositório impacta a complexidade de onboarding, o comportamento do gerenciador de pacotes e o processo de build.

Workspaces npm/pnpm são a solução padrão para monorepos, mas introduzem conceitos de hoisting de dependências, configuração de root `package.json`, e comportamentos nem sempre óbvios para devs menos experientes com a toolchain.

O projeto tem objetivo didático — a arquitetura deve ser legível e explicável sem depender de conhecimento prévio de monorepo tooling.

## Decisão

Sem `package.json` raiz com workspaces. Cada `apps/*` é projeto npm completamente independente. O desenvolvedor entra no diretório, roda `npm install` e `npm run dev`. Dois terminais = dois projetos rodando.

## Consequências

**Positivas:**
- Onboarding trivial — sem hoisting magic, sem configuração raiz
- Cada projeto tem seu `node_modules` isolado, sem comportamentos inesperados
- Compatível com Tauri sidecar futuro (cada app é processo independente)

**Negativas:**
- Dependências comuns instaladas duas vezes
- Necessário dois terminais para desenvolvimento local
- Sem pacote `shared/` entre apps (não é necessário no escopo atual)

**Neutras:**
- Sem Turborepo ou ferramentas de build orchestration

## Alternativas consideradas

- **npm/pnpm workspaces** — introduz hoisting, root package.json, conceitos extras sem benefício real dado que não há código compartilhado entre apps
- **Turborepo** — adiciona turbo.json, pipeline de build, complexidade de caching que não se justifica com dois projetos simples
- **Dois repositórios separados** — dificulta visualizar a relação web/api, PR unificado impossível
