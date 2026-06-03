# Decisões de escopo — planejAÍ v2.0

Registro de decisões não-triviais tomadas pelo Product Owner sobre escopo, IN/OUT, e refinamentos.

| ID | Data | Solicitante | Decisão | Consequências |
|----|------|-------------|---------|---------------|
| DEC-PO-001 | 2026-05-19 | product-owner-agent | Escopo v2.0 fechado nas US-01 a US-10 (todas obrigatórias) | Qualquer feature fora deste conjunto é OUT OF SCOPE até decisão explícita |
| DEC-PO-002 | 2026-05-19 | product-owner-agent | Confirmados OUT OF SCOPE v2.0: autenticação, deploy cloud, mobile responsivo, exportação CSV/PDF, importação OFX, push notifications, i18n, dark mode, Tauri shell | Recusar qualquer pedido nessas áreas |
| DEC-PO-003 | 2026-05-20 | product-owner-agent | US-04: endpoint `PUT /api/faturas/:id/transacoes` é obrigatório — fluxo de edição de categorias por transação referenciado no corpo da US mas omitido na seção Endpoints. Adicionado ao arquivo. | backend-agent deve implementar o endpoint; frontend-agent deve consumir para edição de categoria pós-análise |
| DEC-PO-004 | 2026-05-20 | product-owner-agent | US-09: endpoints para `DivisaoEntry` (`GET /api/divisao`, `POST /api/divisao`, `PUT /api/divisao/:id`) são obrigatórios — fluxo de "quitar entrada" e "adicionar entrada manual" são features core da US mas não tinham endpoints documentados. Adicionados ao arquivo. | backend-agent deve implementar os 3 endpoints; DivisaoEntry nunca é deletada — apenas marcada quitado=true |
| DEC-PO-005 | 2026-05-20 | product-owner-agent | US-10: endpoints para gestão de Abas (`GET /api/abas`, `POST /api/abas`, `PUT /api/abas/:id`) são obrigatórios — fluxo de criação e edição de abas documentado no corpo da US mas sem endpoints. Adicionados ao arquivo. | backend-agent deve implementar; Aba padrão (Pessoal, Familiar) não é deletável — soft-delete apenas para abas criadas pelo usuário |
| DEC-LEAD-001 | 2026-05-20 | lead-agent | Intervenção após FALHOU no review backend setup: 2 bloqueadores identificados pelo architect-agent (prefixo `/api` ausente em `finances.module.ts`; query param `deleteAll` deve ser `serie` em `despesas.routes.ts` e `rendimentos.routes.ts`). Correções específicas transmitidas ao backend-agent via SendMessage. | backend-agent deve corrigir e re-submeter; architect-agent deve re-revisar os 3 arquivos afetados; QA permanece bloqueado até APROVADO |
| DEC-LEAD-002 | 2026-05-20 | lead-agent | Frontend (apps/web) não tinha nenhum arquivo apesar do status.md indicar EM ANDAMENTO. Status corrigido para PENDENTE. frontend-agent notificado para iniciar setup com Next.js 15 + design tokens. Trabalho de frontend é independente do bloqueio backend. | frontend-agent pode avançar em paralelo; não depende das correções do backend |
| DEC-INV-001 | 2026-05-27 | lead-invest-agent | Novo modelo Posição + Movimentações substitui snapshots mensais. Posição existe permanentemente (sem mesRef). Movimentação registra evento mensal (APORTE/RENDIMENTO/RESGATE). | Schema migrado via migration.sql. Dados históricos preservados como movimentações. |
| DEC-INV-002 | 2026-05-27 | product-owner-invest-agent | saldo_atual calculado em runtime pelo backend (Σ movimentações) — nunca armazenado como campo. | PrismaInvestimentoRepository.findMany() inclui movimentacoes e calcula métricas inline. |
| DEC-INV-003 | 2026-05-27 | product-owner-invest-agent | Soft delete de posição via ativo=false — movimentações históricas preservadas (onDelete: Cascade não dispara em deactivate). | DELETE /posicoes/:id → ativo=false. Dados nunca deletados. |
| DEC-INV-004 | 2026-05-27 | architect-invest-agent | Dashboard totalInvestido usa saldo_atual das posições ativas, não mesRef-filtered. | get-dashboard.use-case.ts atualizado para findMany({ ativo: true }). |
| DEC-ACERTO-001 | 2026-05-28 | product-owner-acerto-agent | Escopo fechado: somente US-12 + US-13. OUT: notificações, integração Pix, exportação PDF, gestão de splits (US-09). | Rejeitar qualquer pedido fora deste conjunto. Detalhe na seção "Acerto de Contas" abaixo. |
| DEC-ACERTO-002 a 010 | 2026-05-28 | product-owner-acerto-agent | Regras de negócio do Acerto de Contas (mesRef da despesa, somenteMeu, FIFO parcial, N pessoas, pendências anteriores, cartao_ciclo, direção do saldo, delete reverte, não-editável). | Ver seção dedicada "Acerto de Contas (US-12 + US-13)" abaixo. |

---

# Acerto de Contas (US-12 + US-13)

> **Contrato publicado pelo product-owner-acerto-agent** — time `planejai-acerto-team`.
> Decisões vinculantes para backend, frontend, architect e QA.
> Dúvida de negócio durante a implementação? Consultar este documento primeiro; se não estiver coberto, perguntar ao product-owner-acerto-agent via SendMessage.

**User stories cobertas:**
- US-12 — Visualizar saldo consolidado de acerto mensal (`US-12-visualizar-saldo-acerto-mensal.md`)
- US-13 — Registrar acerto de contas e consultar histórico (`US-13-registrar-acerto-contas.md`)

## Decisões

### DEC-ACERTO-001 — Escopo fechado
Somente US-12 e US-13. **NÃO** incluído: notificações (WhatsApp/email/push), integração Pix ou API bancária, exportação PDF, gestão de splits/pessoas (US-09, já implementada — não tocar). Pedidos fora disso devem ser rejeitados e redirecionados ao team lead.

### DEC-ACERTO-002 — `mesRef` de acerto vem da despesa
O `mesRef` da **despesa** determina o mês do acerto — **nunca** a data de vencimento.
> Ex.: aluguel lançado em `2026-05` com vencimento `07/06` → entra no acerto de `2026-05`.

### DEC-ACERTO-003 — `somenteMeu` exclui do acerto
Despesas com `somenteMeu = true` **NÃO** entram no cálculo de splits. Não aparecem no acerto de nenhuma pessoa.

### DEC-ACERTO-004 — Acerto parcial usa FIFO
Acerto com valor **menor** que o saldo total pendente: distribuir pelos splits pendentes **ordenados por `Despesa.data` ASC** (mais antigo primeiro). Quitar do mais antigo ao mais novo até esgotar o valor; o último coberto pode ficar **parcialmente** quitado. O restante continua pendente.

### DEC-ACERTO-005 — Grupo com N pessoas
Funciona para qualquer número de pessoas. Cada pessoa do grupo — **exceto o usuário principal**, identificado por `pessoa.padrao = true` — tem saldo independente. Não assumir par pagador/recebedor.

### DEC-ACERTO-006 — Pendências de meses anteriores
Splits não quitados de meses anteriores aparecem em **seção separada** ("Pendências de meses anteriores") e **somam ao saldo total** da pessoa. Ativado por `incluirAnteriores=true` na query. Cada pendência indica o mês de origem.

### DEC-ACERTO-007 — `cartao_ciclo` entra normalmente
Despesas do tipo `cartao_ciclo` (geradas ao fechar ciclo de cartão) entram no cálculo do acerto normalmente, respeitando os splits registrados.

### DEC-ACERTO-008 — Direção do saldo sempre explícita
Exibir sempre a direção:
- `a_receber` → **"Fulano deve R$ X a você"**
- `a_pagar` → **"Você deve R$ X a Fulano"**

Nunca apenas um número sem contexto de direção.

### DEC-ACERTO-009 — Delete de acerto reverte quitação
Ao excluir um `AcertoEntry`: reverter o `valorQuitado` de todos os `DespesaSplit` cobertos (subtrair o `valorCoberto` de cada `AcertoDespesaSplit`); os splits voltam a **pendente**. A FK `AcertoDespesaSplit.splitId` é **RESTRICT** — não se pode deletar um `DespesaSplit` com acerto vinculado; deletar o `AcertoEntry` primeiro (cascade limpa os `AcertoDespesaSplit`; o use case reverte o `valorQuitado`).

### DEC-ACERTO-010 — Acerto não é editável
Acerto registrado **não pode ser editado** — apenas **excluído e re-lançado**.

## Mapa de impacto

**BD afetado:** `gestao.db` (Prisma) — duas tabelas novas + 1 campo:
- `AcertoEntry` (id, pessoaId, mesRef, valor, data, formaPagamento, observacao?, criadoEm)
- `AcertoDespesaSplit` (id, acertoId, splitId, valorCoberto) — `onDelete: Cascade` no acerto; `RESTRICT` no split
- Campo novo em `DespesaSplit`: `valorQuitado Float @default(0)`

**Backend (`apps/api/src/modules/finances`):**
- `application/use-cases/GetAcertoMensalUseCase.ts`
- `application/use-cases/CreateAcertoUseCase.ts`
- `application/use-cases/DeleteAcertoUseCase.ts`
- `application/use-cases/ListAcertosUseCase.ts`
- `http/routes/acertoRoutes.ts`

**Endpoints:**
- `GET /api/acerto?mesRef=YYYY-MM&incluirAnteriores=true`
- `POST /api/acerto` — body `{ pessoaId, mesRef, valor, data, formaPagamento, observacao? }`
- `DELETE /api/acerto/:id`
- `GET /api/acerto/historico?pessoaId=&mesRefInicio=&mesRefFim=`

**Frontend (`apps/web`):**
- `src/app/acerto/page.tsx` — abas "Acerto do mês" (US-12) + "Histórico" (US-13)
- Navegação principal → `/acerto`

---

`2026-05-28` — product-owner-acerto-agent: contrato de decisões publicado (DEC-ACERTO-001 a 010).
