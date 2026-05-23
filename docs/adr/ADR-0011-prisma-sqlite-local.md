# ADR-0011: Prisma + SQLite unificado (offline-first)

- **Status:** Accepted
- **Data:** 2026-05-19
- **Supersede:** ADR-0002 (3 bancos SQLite separados)

## Contexto

O v1.0 tinha três bancos SQLite separados (`gestao.db`, `faturas.db`, `acompanhamento.db`) com conexões independentes e sem foreign keys entre eles. A separação foi uma escolha de isolamento rápido no MVP Streamlit, não uma decisão arquitetural consciente.

A reescrita TypeScript usa Prisma como ORM, que gera tipos TypeScript a partir do schema. Manter três bancos separados no Prisma exigiria três `PrismaClient` distintos, três arquivos `schema.prisma`, e tornaria joins entre entidades (ex: despesa + cartão + pessoa) impossíveis via ORM.

O projeto é pessoal (single-user), offline-first — sem necessidade de servidor de banco, replicação ou pooling de conexões.

## Decisão

Um único `apps/api/prisma/schema.prisma` com SQLite como provider. Um único arquivo de banco `data/planejAI.db`. PrismaClient singleton instanciado em `src/shared/prisma.ts`. As entidades dos três bancos legados são consolidadas em um único schema com foreign keys explícitas.

## Consequências

**Positivas:**
- Prisma gera todos os tipos TypeScript de uma vez — type-safety completo
- Foreign keys reais entre todas as entidades (Despesa → Cartao, Snapshot → Cartao, etc.)
- Um único arquivo de banco para backup e migração
- JOIN via Prisma `include` — sem lógica de merge manual em Python
- Migrations versionadas com `prisma migrate`

**Negativas:**
- Migração de dados do legado requer script de conversão (3 DBs → 1)
- SQLite tem limitações em operações de alteração de schema (`ALTER TABLE` restrito) — Prisma lida com isso via `prisma migrate`
- Sem `mode: 'insensitive'` na busca (feature Postgres-only) — busca case-sensitive ou normalizada em JS

**Neutras:**
- SQLite suficiente para single-user; escalar para Postgres no futuro requer apenas trocar provider no schema

## Alternativas consideradas

- **Prisma + Neon Postgres (cloud)** — exigiria conexão de internet, contraria requisito offline-first, custos de hosting
- **Prisma + Postgres local (Docker)** — adiciona dependência de Docker para dev; overhead desnecessário para single-user
- **Drizzle ORM** — mais leve mas ecossistema menor, menos documentação, geração de tipos menos madura
- **Manter 3 SQLite separados** — impossibilita foreign keys entre domínios, 3 PrismaClients, sem joins
- **better-sqlite3 direto (sem ORM)** — sem geração de tipos, sem migrations versionadas, mais próximo do legado Python mas sem benefícios de type-safety
