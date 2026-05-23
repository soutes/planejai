# US-09: Gerenciar pessoas e splits

**Como** usuário, **quero** cadastrar pessoas e configurar como os gastos são divididos entre elas, **para** controlar quem me deve e quanto eu devo a cada um.

## Telas relacionadas
`/gestao` — seção de pessoas + seção de divisão de gastos

## Fluxo principal

### Pessoas
1. Usuário cadastra pessoa: nome, cor
2. Associa pessoa a abas de despesa com ratio padrão (ex: cônjuge 50% na aba Familiar)
3. Edita ou desativa pessoa

### Divisão de gastos
1. Usuário vê saldo por pessoa (quem deve quanto)
2. Vê histórico de entradas pendentes e quitadas
3. Marca entrada como quitada quando o dinheiro foi recebido/pago
4. Adiciona entrada manual de divisão

## Endpoints

### Pessoas
- `GET /api/pessoas`
- `POST /api/pessoas`
- `PUT /api/pessoas/:id`

### Divisão de gastos (DivisaoEntry)
- `GET /api/divisao?pessoaId=&quitado=` — lista entradas de divisão (filtros opcionais)
- `POST /api/divisao` → `{ pessoaId, valor, descricao, direcao, mesRef }` — entrada manual
- `PUT /api/divisao/:id` → `{ quitado: true }` — quitar entrada (nunca deletar)

## Notas de produto
- `DivisaoEntry` é criado automaticamente quando despesa tem split (via `sync_cartao_ciclo` ou ao criar despesa com aba de split)
- `direcao: 'a_receber'` = a pessoa me deve | `'a_pagar'` = eu devo à pessoa
- Quitar entrada não apaga — marca `quitado=true` para manter histórico
- Saldo líquido por pessoa = soma `a_receber` - soma `a_pagar` (não quitados)

## Fora do escopo
- Grupos de despesa (splitwise-style entre vários)
- Integração com PIX / pagamento direto
- Lembretes automáticos de cobrança
