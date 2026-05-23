# ADR-0002: Separação em 3 bancos SQLite

- **Status:** Accepted
- **Data:** 2026-05-15

## Contexto

O app cobre três domínios com ciclos de vida e responsabilidades distintos:
gestão financeira geral (despesas, rendimentos, metas), análise de faturas de cartão
e acompanhamento de investimentos. Colocar tudo em um único banco levaria a tabelas
com muitos campos opcionais e acoplamento entre módulos que evoluem em ritmos
diferentes.

## Decisão

Separar os dados em três arquivos SQLite independentes:

- `data/gestao.db` — despesas, rendimentos, categorias, metas mensais
- `data/faturas.db` — faturas de cartão, transações, análises do agente IA
- `data/acompanhamento.db` — aportes, carteira de investimentos, benchmarks

Cada módulo (`src/database.py`, `src/database_gestao.py`, etc.) gerencia
exclusivamente o seu banco.

## Consequências

- Foreign keys cruzadas entre bancos são impossíveis no SQLite. Toda sincronização
  entre domínios (ex.: total do cartão → despesa em gestao.db) é feita por código
  Python explícito, com lógica de idempotência.
- Isolamento real: uma corrupção ou migração em `faturas.db` não afeta `gestao.db`.
- Backup granular: é possível restaurar apenas um domínio.
- Queries que cruzam domínios (ex.: relatório unificado) exigem joins em memória
  via Python, não SQL nativo.

## Alternativas consideradas

**Banco único (`app.db`):** mais simples, queries cross-domain nativas, uma única
string de conexão. Descartado porque acoplaria módulos com responsabilidades
distintas e dificultaria migrações independentes à medida que o app cresce.
