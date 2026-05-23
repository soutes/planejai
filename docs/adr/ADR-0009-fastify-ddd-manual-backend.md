# ADR-0009: Fastify 5 + DDD manual no backend

- **Status:** Accepted
- **Data:** 2026-05-19
- **Decisores:** dev

## Contexto

O backend v2.0 precisa expor ~25 endpoints REST para o frontend Next.js. O v1.0 usava Python/SQLite direto sem camada HTTP — a lógica de domínio estava espalhada em módulos `database_*.py`.

A reescrita TypeScript é oportunidade de estruturar o código com separação clara de responsabilidades (domínio, aplicação, infra, HTTP) e facilitar manutenção futura.

A escolha do framework HTTP impacta: performance de cold start (irrelevante aqui, mas bom hábito), ergonomia de validação de tipos, e tamanho do bundle.

O objetivo pedagógico é mostrar DDD/Clean Architecture de forma explícita — as camadas devem ser visíveis no código sem framework mágico obscurecendo as dependências.

## Decisão

Fastify 5 + `fastify-type-provider-zod` para validação. DDD/Clean estruturado manualmente em `modules/{finances,intelligence}/{domain,application,infra,http}/`. DI via factory `buildFinancesModule(prisma)` sem decorators ou container. Erros são `HttpError` lançados diretamente nos use cases — sem Result/Either pattern.

## Consequências

**Positivas:**
- `buildFinancesModule` explicita todas as dependências em ~30 linhas legíveis
- Domínio puro — `domain/` nunca importa Fastify ou Prisma (testável com repos fake)
- Zod valida e infere tipos simultaneamente — sem duplicação de schema
- Fastify 5 + zod-provider: menos casts `as` que versões anteriores
- HttpError imediatamente compreensível para devs com background Express/Fastify

**Negativas:**
- Sem scaffolding automático — estrutura de pastas criada manualmente
- `buildFinancesModule` cresce linearmente conforme novos use cases são adicionados
- HttpError levemente acopla use case ao HTTP (aceitável na escala atual)

**Neutras:**
- `toDomain()` inline nos repos (sem classe Mapper) — decisão complementar em ADR-0012

## Alternativas consideradas

- **NestJS** — esconde as camadas com decorators, cold start mais pesado (~200ms vs ~5ms Fastify), DI automático obscurece dependências
- **Express** — sem validação de schema integrada, menos type-safety, mais boilerplate
- **Hono** — menor ecossistema, menos documentação disponível
- **Manter Python/FastAPI** — obrigaria manter dois runtimes (Node + Python), quebrando o objetivo de stack TypeScript unificada
