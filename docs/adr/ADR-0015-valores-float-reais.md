# ADR-0015: Valores monetários em Float (reais, não centavos)

- **Status:** Accepted
- **Data:** 2026-05-19

## Contexto

O padrão mais seguro para valores monetários em bancos de dados é armazenar em centavos (inteiros), evitando erros de ponto flutuante. No entanto, o legado Python usa `REAL` (Float) em todas as tabelas SQLite — valores em reais com até 2 casas decimais.

A migração de dados do legado para o v2.0 é um requisito. Converter todos os valores para centavos exigiria fator de multiplicação ×100 em todas as tabelas, com risco de erros de arredondamento na conversão e necessidade de dividir ×100 em todas as exibições.

O escopo é pessoal — volumes de transação são baixos e não há requisito de operações matemáticas complexas que amplificariam erros de ponto flutuante.

## Decisão

Valores monetários armazenados como `Float` em reais no Prisma schema (SQLite `REAL`). Mesmo padrão do legado. Exibição sempre com `toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })` no frontend — nunca formatar manualmente.

## Consequências

**Positivas:**
- Migração de dados do legado sem conversão de escala
- Consistência total com o banco legado — nenhum dado corrompido na migração
- Mais legível para debug — ver `1250.50` no banco é imediatamente compreensível

**Negativas:**
- Float pode ter erros de arredondamento em somas longas (ex: `0.1 + 0.2 = 0.30000000000000004`)
- Não é o padrão da indústria para sistemas financeiros críticos

**Neutras:**
- Para uso pessoal single-user, erros de centavo em somas são aceitáveis
- `toFixed(2)` antes de salvar mitiga a maioria dos casos problemáticos

## Alternativas consideradas

- **Centavos (Integer)** — padrão correto para sistemas financeiros profissionais, mas exigiria conversão de todos os dados legados e divisão ×100 em todo o frontend
- **Decimal.js / big.js** — bibliotecas de precisão arbitrária resolvem o problema de Float mas adicionam dependência e conversão de tipos em toda a stack; overkill para uso pessoal
