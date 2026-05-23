# US-11: Visualizar cartões separados por tipo (pessoal vs familiar)

**Como** usuário com múltiplos cartões de crédito
**eu quero** ver meus cartões organizados por tipo — pessoal ou familiar — com indicadores de gasto consolidado por grupo
**para que** eu entenda de forma imediata quanto gastei em cada esfera (minha vs da família) sem precisar navegar cartão por cartão

## Critérios de aceite

- [ ] CA-01: A página `/cartao` exibe um seletor lateral ou cabeçalho com dois grupos fixos: **Pessoal** e **Familiar**. O grupo ativo é destacado visualmente.
- [ ] CA-02: Dentro de cada grupo, os cartões são listados como chips/cards clicáveis contendo: nome do cartão, últimos 4 dígitos, cor do cartão e total gasto no ciclo atual.
- [ ] CA-03: Ao selecionar um cartão individual, a área principal exibe o detalhe daquele cartão (igual ao fluxo atual da US-04 e US-05): ciclo, total, delta vs ciclo anterior, % do limite, upload de fatura, histórico de transações.
- [ ] CA-04: Cada grupo exibe, no topo da lista, um **card de consolidado do grupo** com: soma total gasto no ciclo entre todos os cartões do grupo, número de cartões e data do próximo fechamento mais próximo. Este card não é clicável — é somente leitura.
- [ ] CA-05: Se um grupo tiver apenas um cartão, o card de consolidado não aparece — o cartão individual já é o consolidado.
- [ ] CA-06: Um cartão cujo `abaId` aponta para uma `AbaDespesa` com `pessoaId` preenchido é classificado como **Pessoal**. Um cartão com `abaId` apontando para aba com `pessoaId null` é classificado como **Familiar**.
- [ ] CA-07: Se o usuário não tiver cartões em um dos grupos (ex: nenhum cartão familiar), aquele grupo é omitido da navegação — o app abre diretamente no único grupo disponível.
- [ ] CA-08: O grupo e cartão selecionados são preservados na URL como query params (`?grupo=familiar&cartaoId=3`) para que o usuário possa compartilhar ou recarregar a página no mesmo estado.
- [ ] CA-09: A seção de **Tendências** na página exibe gráficos por grupo selecionado. Ao visualizar o grupo Familiar, o gráfico de linha histórica (últimos 6 ciclos) soma todos os cartões familiares. Ao visualizar um cartão individual, o gráfico mostra apenas aquele cartão.
- [ ] CA-10: No grupo Familiar com múltiplos cartões, há um toggle "Por cartão / Consolidado" no gráfico de tendência. Em modo "Por cartão", o gráfico mostra uma linha por cartão (com a cor do cartão). Em modo "Consolidado", exibe uma linha única somada.
- [ ] CA-11: Cartões inativos (`ativo = false`) não aparecem em nenhum grupo.

## Notas técnicas

- **Arquivo(s):** `apps/web/src/app/cartao/page.tsx`, `apps/web/src/app/cartao/CartaoNav.tsx` (componente de navegação por grupo), `apps/web/src/app/cartao/CartaoConsolidado.tsx`
- **BD afetado:** nenhuma alteração de schema — a classificação pessoal/familiar é derivada da relação `Cartao → AbaDespesa.pessoaId`
- **Endpoints necessários:**
  - `GET /api/cartoes` — já previsto na US-08; precisa incluir no retorno: `abaId`, `aba.pessoaId` (via `include: { aba: true }` no Prisma) e o total do ciclo atual (`totalCicloAtual`) calculado a partir dos snapshots
  - `GET /api/cartoes/consolidado?grupo=pessoal|familiar` — novo endpoint que retorna: soma de `totalCicloAtual` de todos os cartões do grupo, lista de `proximoFechamento` ordenada, e histórico dos últimos 6 ciclos somado por grupo
- **Decisão de design adotada:** navegação em dois grupos fixos (Pessoal | Familiar) com seletor de cartão individual dentro de cada grupo — em vez de seletor único com badge. Razão: com múltiplos cartões familiares e pessoais, um seletor único cresce demais e perde a separação semântica que o usuário quer ver de imediato.
- **Derivação do grupo no frontend:** `cartao.aba.pessoaId !== null` → Pessoal; `pessoaId === null` → Familiar. Não existe campo `tipo` no banco — a classificação é sempre derivada.
- **Tendências:** o gráfico de histórico usa `GET /api/snapshots?cartaoId=` (já existente na US-05) para cartão individual. Para o consolidado de grupo, usa o novo endpoint `GET /api/cartoes/consolidado`.
- **Query params de URL:** implementados via `useSearchParams` do Next.js App Router — sem estado global.
- **Dependências:**
  - US-04 (análise de fatura) deve estar implementada para haver `totalCicloAtual` nos snapshots
  - US-05 (acompanhamento de ciclo) fornece a estrutura de snapshot que alimenta os totais
  - US-08 (gerenciar cartões) deve existir para que cartões tenham `abaId` válido e cor configurada

## Fora de escopo

- Gráfico de tendência cruzando grupo Pessoal com Familiar no mesmo eixo
- Reordenação manual de cartões dentro de um grupo
- Filtro de período personalizado nas tendências (apenas últimos 6 ciclos fixos)
- Exibição de transações individuais no card de consolidado de grupo — ele mostra apenas totais
- Criação ou edição de cartões nesta tela (isso pertence à US-08 em `/gestao`)
- Notificação de vencimento próximo (fora do MVP)
