# ADR-0012: DDD enxuto com dois bounded contexts

- **Status:** Accepted
- **Data:** 2026-05-19

## Contexto

O domínio do planejAÍ tem dois grupos de responsabilidades claramente distintos:
1. **Gestão financeira** — CRUD de despesas, rendimentos, investimentos, cartões, pessoas, splits, orçamentos
2. **Inteligência artificial** — extração de faturas (PDF/imagem), geração de relatórios, análise de padrões

No v1.0, essas responsabilidades estavam misturadas nos módulos Python sem separação clara. O backend v2.0 é oportunidade de estruturar isso corretamente.

O risco é exagerar na separação: múltiplos bounded contexts com domain events, CQRS, sagas — complexidade que não se justifica para um app single-user com ~25 endpoints.

## Decisão

Dois bounded contexts em `modules/finances/` e `modules/intelligence/`. Cada um com quatro camadas explícitas (`domain`, `application`, `infra`, `http`). `toDomain()` inline nos repos (sem classe Mapper separada). Um único Value Object didático por contexto. Errors como `HttpError` — sem Result/Either. Sem domain events.

O contexto `intelligence` chama o `finances` apenas via repositórios compartilhados (PrismaClient passado como dep) para ler contexto financeiro ao gerar relatórios — não há chamada de use case de um contexto para o outro.

## Consequências

**Positivas:**
- Pasta `modules/finances/` cabe em uma tela — inversão de dependência visível
- `domain/` zero imports de Fastify/Prisma/Anthropic — testável com repos fake
- Separação clara entre lógica financeira e lógica de IA
- `toDomain()` inline: sem arquivo Mapper extra por entidade
- HttpError diretamente compreensível — sem aprender Result/Either antes de usar use cases

**Negativas:**
- Se o projeto crescer (multi-user, billing, notificações), `finances` precisará ser particionado — custo de refactor aumenta
- `toDomain()` espalhado nos repos é harder to find em escala maior
- HttpError nos use cases acopla levemente ao HTTP

**Neutras:**
- Sem Mapper class: `toDomain()` inline é a prática adotada quando há um-para-um entre schema e entidade

## Alternativas consideradas

- **Um único módulo** (`modules/core/`) — sem separação de responsabilidades, dificulta manutenção da lógica de IA separada da financeira
- **Três ou mais bounded contexts** (finances, cards, ai, reporting) — overkill para scope atual, overhead sem benefício
- **Result/Either pattern** — adiciona complexidade de tipo antes dos use cases serem úteis; HttpError resolve os casos de erro deste domínio
- **Mapper class separada** — arquivo extra por entidade sem ganho real em escala atual
- **Domain events + CQRS** — nenhum caso de uso atual requer async ou projeções separadas
