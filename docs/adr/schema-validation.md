# Schema Validation — planejAÍ v2.0
Data: 2026-05-20

## Resultado: ✅ APROVADO

Comparação campo a campo entre `docs/erd.md` e `apps/api/prisma/schema.prisma`.
Todos os 17 modelos estão presentes, com campos, tipos, defaults, índices e relacionamentos corretos.

---

## Modelos — presença e campos

| Modelo | Presença | Campos | Resultado |
|--------|----------|--------|-----------|
| `Pessoa` | ✅ | id, nome, cor (#B07AFF), ativo (true) | ✅ |
| `AbaDespesa` | ✅ | id, nome, icon (💸), cor (#10F5A3), ordem (0), splitDestinoCategoria?, ativo (true) | ✅ |
| `AbaPessoa` | ✅ | id, abaId, pessoaId, ratioDefault (0.5) | ✅ |
| `Categoria` | ✅ | id, nome @unique, icon (📌), padrao (false), permanente (true), ativa (true) | ✅ |
| `RegraFixa` | ✅ | id, abaId, descricao, categoria, valor, diaVencimento?, ativo (true) | ✅ |
| `CategoryRule` | ✅ | id, pattern @unique, categoria, createdAt | ✅ |
| `Despesa` | ✅ | id, abaId, mesRef, data?, descricao, categoria, valor, notas?, tipo ("manual"), recorrente (false), totalRepeticoes?, origemId?, parcelaNum?, totalParcelas?, emFaturaCartao (false), cartaoId?, somenteMeu (false) | ✅ |
| `DespesaSplit` | ✅ | id, despesaId, pessoaId, ratio, valorCalculado | ✅ |
| `DivisaoEntry` | ✅ | id, pessoaId, mesRef, descricao, valorTotal, direcao ("a_receber"), parcelado (false), totalParcelas?, parcelaAtual? (1), dataInicio?, origemDespesaId?, quitado (false), notas? | ✅ |
| `Orcamento` | ✅ | id, abaId, mesRef?, categoria, valorMeta | ✅ |
| `Rendimento` | ✅ | id, mesRef, descricao, categoria ("Salário"), valor, recorrente (false), totalRepeticoes?, origemId? | ✅ |
| `Investimento` | ✅ | id, mesRef, categoria, instituicao (""), valor, aporteMe (0), notas? | ✅ |
| `Cartao` | ✅ | id, nome, proprietario?, finalDigitos?, cor (#10F5A3), limite?, diaFechamento (5), ativo (true), abaId? | ✅ |
| `CartaoSplit` | ✅ | id, cartaoId, pessoaId, ratio | ✅ |
| `Fatura` | ✅ | id, fileHash @unique, arquivoOriginal, banco?, mesReferencia?, vencimento?, total?, limite?, comentarioExecutivo?, analiseJson, criadoEm, cartaoId | ✅ |
| `Transacao` | ✅ | id, faturaId, data?, descricao?, estabelecimento?, valor?, categoria?, parcela? | ✅ |
| `SnapshotCiclo` | ✅ | id, cartaoId, cicloInicio, cicloFim, dataUpload, total, qtdTransacoes (0), jsonDados | ✅ |

---

## Índices

| Tabela | Índice ERD | Tipo | Implementado | Resultado |
|--------|-----------|------|--------------|-----------|
| `AbaPessoa` | `(abaId, pessoaId)` | UNIQUE | `@@unique([abaId, pessoaId])` | ✅ |
| `Categoria` | `nome` | UNIQUE | `@unique` no campo | ✅ |
| `CategoryRule` | `pattern` | UNIQUE | `@unique` no campo | ✅ |
| `Despesa` | `(abaId, mesRef)` | INDEX | `@@index([abaId, mesRef])` | ✅ |
| `Despesa` | `(cartaoId, mesRef)` | INDEX | `@@index([cartaoId, mesRef])` | ✅ |
| `Despesa` | `origemId` | INDEX | `@@index([origemId])` | ✅ |
| `DivisaoEntry` | `(pessoaId, quitado)` | INDEX | `@@index([pessoaId, quitado])` | ✅ |
| `DivisaoEntry` | `mesRef` | INDEX | `@@index([mesRef])` | ✅ |
| `Orcamento` | `(abaId, mesRef, categoria)` | UNIQUE | `@@unique([abaId, mesRef, categoria])` | ✅ |
| `Rendimento` | `mesRef` | INDEX | `@@index([mesRef])` | ✅ |
| `Investimento` | `mesRef` | INDEX | `@@index([mesRef])` | ✅ |
| `Investimento` | `(mesRef, categoria, instituicao)` | UNIQUE | `@@unique([mesRef, categoria, instituicao])` | ✅ |
| `CartaoSplit` | `cartaoId` | INDEX | `@@index([cartaoId])` | ✅ |
| `CartaoSplit` | `(cartaoId, pessoaId)` | UNIQUE | `@@unique([cartaoId, pessoaId])` | ✅ |
| `Fatura` | `fileHash` | UNIQUE | `@unique` no campo | ✅ |
| `Fatura` | `cartaoId` | INDEX | `@@index([cartaoId])` | ✅ |
| `Fatura` | `mesReferencia` | INDEX | `@@index([mesReferencia])` | ✅ |
| `Transacao` | `faturaId` | INDEX | `@@index([faturaId])` | ✅ |
| `Transacao` | `categoria` | INDEX | `@@index([categoria])` | ✅ |
| `Transacao` | `data` | INDEX | `@@index([data])` | ✅ |
| `SnapshotCiclo` | `cartaoId` | INDEX | `@@index([cartaoId])` | ✅ |
| `SnapshotCiclo` | `(cicloInicio, cicloFim)` | INDEX | `@@index([cicloInicio, cicloFim])` | ✅ |

---

## Relacionamentos (onDelete)

| Relação ERD | Comportamento | Declaração no schema | Resultado |
|-------------|--------------|----------------------|-----------|
| `AbaDespesa → AbaPessoa CASCADE` | Cascade | `onDelete: Cascade` explícito | ✅ |
| `Pessoa → AbaPessoa CASCADE` | Cascade | `onDelete: Cascade` explícito | ✅ |
| `AbaDespesa → Despesa CASCADE` | Cascade | `onDelete: Cascade` explícito | ✅ |
| `AbaDespesa → RegraFixa CASCADE` | Cascade | `onDelete: Cascade` explícito | ✅ |
| `AbaDespesa → Orcamento CASCADE` | Cascade | `onDelete: Cascade` explícito | ✅ |
| `AbaDespesa → Cartao SET NULL` | SetNull | `abaId Int?` sem onDelete → Prisma default SetNull para nullable | ✅ |
| `Despesa → DespesaSplit CASCADE` | Cascade | `onDelete: Cascade` explícito | ✅ |
| `Pessoa → DespesaSplit CASCADE` | Cascade | `onDelete: Cascade` explícito | ✅ |
| `Pessoa → DivisaoEntry CASCADE` | Cascade | `onDelete: Cascade` explícito | ✅ |
| `Despesa → DivisaoEntry SET NULL` | SetNull | `origemDespesaId Int?` sem onDelete → Prisma default SetNull para nullable | ✅ |
| `Cartao → Fatura RESTRICT` | Restrict | `cartaoId Int` (não-nullable) sem onDelete → Prisma default Restrict | ✅ |
| `Cartao → SnapshotCiclo CASCADE` | Cascade | `onDelete: Cascade` explícito | ✅ |
| `Cartao → CartaoSplit CASCADE` | Cascade | `onDelete: Cascade` explícito | ✅ |
| `Pessoa → CartaoSplit CASCADE` | Cascade | `onDelete: Cascade` explícito | ✅ |
| `Fatura → Transacao CASCADE` | Cascade | `onDelete: Cascade` explícito | ✅ |
| `Cartao → Despesa SET NULL` | SetNull | `cartaoId Int?` sem onDelete → Prisma default SetNull para nullable | ✅ |

**Nota:** Quatro relacionamentos usam o comportamento padrão do Prisma (SetNull para FK nullable, Restrict para FK required) em vez de declaração explícita. O comportamento de runtime é **idêntico** ao especificado no ERD. Não é um bloqueador, mas o `backend-agent` pode optar por tornar esses `onDelete` explícitos para maior clareza.

---

## Divergências encontradas

Nenhuma divergência funcional. Todas as tabelas, campos, tipos, defaults, índices e comportamentos de FK estão em conformidade com o ERD.

| Modelo | Campo | ERD | schema.prisma | Correção necessária |
|--------|-------|-----|---------------|---------------------|
| — | — | — | — | Nenhuma |

---

## Observações não-bloqueadoras

1. **onDelete implícito em 4 relações** — `Cartao→Despesa`, `Cartao→Fatura`, `AbaDespesa→Cartao`, `Despesa→DivisaoEntry`: comportamento correto via default do Prisma, mas adicionar `onDelete` explícito tornaria o schema auto-documentado. Sugestão de melhoria, não requisito.

2. **`Despesa.origemId` como plain column** — sem FK declarada, conforme especificado no ERD (`plain col, sem FK`). Correto por design.

3. **`Rendimento.origemId` como plain column** — idem acima. Correto por design.

---

## Conclusão

`schema.prisma` está em **conformidade total** com `erd.md`. O backend pode prosseguir com as migrations e implementação dos repositórios.
