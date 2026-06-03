# US-12: Visualizar saldo consolidado de acerto mensal

**Como** usuário principal (pagador das despesas familiares)
**eu quero** ver, em uma tela de Acerto de Contas, quanto cada membro do grupo me deve (ou eu devo a eles) em um determinado mês
**para que** eu saiba exatamente o valor a ser transferido via Pix no fechamento do mês, sem precisar calcular manualmente

## Critérios de aceite

- [ ] CA-01: A tela exibe um seletor de `mesRef` (YYYY-MM); o padrão é o mês atual.
- [ ] CA-02: Para cada pessoa do grupo (exceto o usuário principal), o sistema exibe o saldo líquido do mês: soma de todos os `DespesaSplit.valorCalculado` cujo `pessoaId` corresponde àquela pessoa, agrupados pelas despesas com `mesRef` igual ao mês selecionado.
- [ ] CA-03: O saldo exibido indica claramente a direção — "Fulano deve R$ X a você" ou "Você deve R$ X a Fulano" — nunca apenas um número sem contexto.
- [ ] CA-04: Cada linha de saldo pode ser expandida para mostrar a lista de despesas que compõem aquele valor (descrição, categoria, valor total da despesa, valor proporcional da pessoa, data de lançamento).
- [ ] CA-05: Despesas com splits de meses anteriores cujo acerto ainda não foi registrado (ver US-13) aparecem em seção separada "Pendências de meses anteriores", somadas ao saldo do mês selecionado com indicação do mês de origem.
- [ ] CA-06: O saldo total exibido no topo por pessoa é a soma do mês atual + pendências anteriores não quitadas.
- [ ] CA-07: Se uma despesa tem `somenteMeu = true`, ela não entra no cálculo de splits — não aparece no acerto.
- [ ] CA-08: Despesas do tipo `cartao_ciclo` (lançadas automaticamente ao fechar um ciclo de cartão) entram no cálculo normalmente, respeitando os splits registrados.
- [ ] CA-09: A tela é acessível pela navegação principal em `/acerto`.

## Notas técnicas

- **Arquivo(s):** `apps/web/src/app/acerto/page.tsx`, `apps/api/src/modules/finances/http/routes/acertoRoutes.ts`, `apps/api/src/modules/finances/application/use-cases/GetAcertoMensalUseCase.ts`
- **BD afetado:** `gestao.db` (tabelas `DespesaSplit`, `Despesa`, `Pessoa`)
- **Dependências:** US-09 (pessoas e splits devem estar implementados)
- **Endpoint sugerido:** `GET /api/acerto?mesRef=YYYY-MM` — retorna array de `{ pessoaId, nome, saldoMesAtual, pendenciasAnteriores, saldoTotal, direcao, despesas[] }`
- **Regra de pendência:** uma despesa split é "pendente" quando não existe nenhum `AcertoEntry` (ver US-13) que a cubra — ou seja, o flag `quitado` correspondente ainda está `false`.
- **Edge case — despesa lançada no mês atual para vencimento futuro:** o `mesRef` da despesa é o que determina em qual mês ela entra no acerto, independente da data de vencimento. Ex: aluguel lançado em 2026-05 com vencimento em 07/06 → entra no acerto de 2026-05.
- **Edge case — grupo com N pessoas:** a lógica deve funcionar para qualquer número de pessoas; não assumir par pagador/recebedor.

## Fora de escopo

- Registrar ou marcar o acerto como pago (coberto em US-13).
- Editar splits diretamente desta tela (coberto em US-09).
- Importar dados do Splitwise ou qualquer app externo.
- Envio automático de notificação/Pix.
