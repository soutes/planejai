# US-13: Registrar acerto de contas e consultar histórico

**Como** usuário principal
**eu quero** marcar um acerto como realizado (Pix enviado/recebido) e consultar o histórico de acertos anteriores
**para que** o sistema saiba quais meses já foram quitados e eu tenha rastreabilidade das transferências feitas

## Critérios de aceite

- [ ] CA-01: Na tela de Acerto de Contas (US-12), cada saldo por pessoa tem um botão "Marcar como quitado" disponível apenas quando o saldo total daquela pessoa (mês atual + pendências) for diferente de zero.
- [ ] CA-02: Ao clicar em "Marcar como quitado", um modal abre com os campos: valor (pré-preenchido com o saldo total calculado, editável), data (padrão hoje), forma de pagamento (Pix, TED, Dinheiro, Outro — select), e observação opcional (campo texto livre).
- [ ] CA-03: Ao confirmar, o sistema cria um registro de `AcertoEntry` no banco com: `pessoaId`, `mesRef` do mês selecionado, `valor`, `data`, `formaPagamento`, `observacao`, e vincula as despesas splits cobertas (via tabela `AcertoDespesaSplit`).
- [ ] CA-04: Após salvar, os splits cobertos pelo acerto são marcados internamente como quitados e deixam de aparecer em "Pendências de meses anteriores" nos meses subsequentes (CA-05 da US-12).
- [ ] CA-05: É possível registrar um acerto parcial — valor menor que o saldo total. Neste caso, o sistema aplica o valor proporcionalmente às despesas mais antigas primeiro (FIFO por data de lançamento), e o restante continua pendente.
- [ ] CA-06: Uma aba "Histórico" na mesma tela `/acerto` lista todos os `AcertoEntry` registrados, em ordem cronológica decrescente, com: nome da pessoa, mês de referência, valor, data, forma de pagamento, observação.
- [ ] CA-07: Cada entrada do histórico pode ser expandida para mostrar quais despesas foram cobertas naquele acerto.
- [ ] CA-08: O histórico pode ser filtrado por pessoa e por intervalo de meses (seletores independentes, ambos opcionais).
- [ ] CA-09: Um acerto registrado pode ser excluído (ícone de lixeira com confirmação). Ao excluir, os splits cobertos voltam ao estado "pendente".
- [ ] CA-10: Não é possível editar um acerto já salvo — apenas excluir e re-lançar.

## Notas técnicas

- **Arquivo(s):**
  - `apps/web/src/app/acerto/page.tsx` (compartilhado com US-12, adiciona aba Histórico)
  - `apps/api/src/modules/finances/http/routes/acertoRoutes.ts`
  - `apps/api/src/modules/finances/application/use-cases/CreateAcertoUseCase.ts`
  - `apps/api/src/modules/finances/application/use-cases/DeleteAcertoUseCase.ts`
  - `apps/api/src/modules/finances/application/use-cases/ListAcertosUseCase.ts`
- **BD afetado:** `gestao.db` — requer duas novas tabelas no schema Prisma:

```prisma
model AcertoEntry {
  id             Int                  @id @default(autoincrement())
  pessoaId       Int
  mesRef         String               // YYYY-MM
  valor          Float
  data           String               // YYYY-MM-DD
  formaPagamento String               // 'pix' | 'ted' | 'dinheiro' | 'outro'
  observacao     String?
  criadoEm       DateTime             @default(now())
  pessoa         Pessoa               @relation(fields: [pessoaId], references: [id])
  splits         AcertoDespesaSplit[]
}

model AcertoDespesaSplit {
  id           Int          @id @default(autoincrement())
  acertoId     Int
  splitId      Int
  valorCoberto Float
  acerto       AcertoEntry  @relation(fields: [acertoId], references: [id], onDelete: Cascade)
  split        DespesaSplit @relation(fields: [splitId], references: [id])
}
```

- **Campo auxiliar em `DespesaSplit`:** adicionar `valorQuitado Float @default(0)` para controle de acertos parciais — o sistema subtrai `valorQuitado` de `valorCalculado` para saber o saldo restante de cada split.
- **Endpoints sugeridos:**
  - `POST /api/acerto` — body `{ pessoaId, mesRef, valor, data, formaPagamento, observacao? }`
  - `DELETE /api/acerto/:id`
  - `GET /api/acerto/historico?pessoaId=&mesRefInicio=&mesRefFim=`
- **Dependências:** US-12 deve estar implementada (a tela de acerto já existe antes desta story).
- **Regra FIFO (acerto parcial):** ao distribuir o valor do acerto parcial, ordenar os splits pendentes por `Despesa.dataLancamento` ASC e quitar da mais antiga para a mais nova até esgotar o valor.

## Fora de escopo

- Notificação automática para a pessoa que deve pagar (WhatsApp, email etc.).
- Integração com API de Pix ou qualquer banco.
- Relatório de acertos em PDF.
- Gestão de splits dentro desta tela (coberta em US-09).
