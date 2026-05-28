Crie um Agent Team chamado `planejaí-invest-refactor-team` com 5 agentes rodando em paralelo, dedicados à **reestruturação completa da sessão de Investimentos**. O time redesenha o modelo de dados (schema + migração), implementa novos endpoints e refatora o frontend — mantendo a arquitetura DDD definida em `ARQUITETURA.md` e `CLAUDE.md`.

**Arquivo de coordenação compartilhado:** todos os agentes leem e escrevem em `docs/status.md` no formato:
```
| Agente | Módulo | Status | Observação |
```
Status possíveis: `EM ANDAMENTO` / `CONTRATO PUBLICADO` / `IMPLEMENTADO` / `APROVADO` / `FALHOU`

---

## Contexto do negócio

### Problema do modelo atual
A tabela `Investimento` usa chave `(pessoaId, mesRef, categoria, instituicao)` — cada linha é um snapshot mensal. Isso não permite:
- Separar aporte de rendimento histórico por posição
- Calcular rentabilidade real (%)
- Alimentar o gráfico de evolução patrimonial com dados reais (hoje usa array vazio)

### Novo modelo: Posição + Movimentações

**`Investimento`** vira uma posição permanente (cadastra uma vez):
```
id, pessoaId, categoria, instituicao, ativo (bool), notas
Unique: (pessoaId, categoria, instituicao)
```

**`MovimentacaoInvestimento`** registra cada evento mensal:
```
id, investimentoId (FK → Investimento), mesRef (YYYY-MM)
tipo: 'APORTE' | 'RENDIMENTO' | 'RESGATE'
valor (Float, sempre positivo), notas
```

**Derivações calculadas pelo backend:**
- `saldo_atual` = Σ(APORTE) − Σ(RESGATE) + Σ(RENDIMENTO) — cumulativo até o mês
- `total_investido` = Σ(APORTE) − Σ(RESGATE) — capital próprio
- `total_rendimentos` = Σ(RENDIMENTO)
- `rentabilidade_pct` = total_rendimentos / total_investido × 100
- `evolucao` = saldo cumulativo por mesRef (últimos 12 meses)

### Migração dos dados existentes
Para cada linha antiga `Investimento(pessoaId, mesRef, categoria, instituicao, valor, aporteMe)`:
1. Criar/reutilizar `Investimento(pessoaId, categoria, instituicao)` como posição
2. Se `aporteMe > 0` → criar `MovimentacaoInvestimento(tipo='APORTE', mesRef, valor=aporteMe)`
3. Para o mês mais antigo de cada posição: criar `MovimentacaoInvestimento(tipo='RENDIMENTO', mesRef, valor=max(0, valor-aporteMe))` como seed do saldo histórico

---

## Contratos de API novos

### Posições

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/investimentos/posicoes` | Lista posições (+ saldo derivado) |
| POST | `/api/investimentos/posicoes` | Cria posição |
| PUT | `/api/investimentos/posicoes/:id` | Edita posição (categoria, instituicao, notas, ativo) |
| DELETE | `/api/investimentos/posicoes/:id` | Desativa posição (soft delete: ativo=false) |

**GET `/api/investimentos/posicoes?pessoaId=&mesRef=`**
Response:
```typescript
Array<{
  id: number
  pessoaId: number | null
  categoria: string
  instituicao: string
  ativo: boolean
  notas: string | null
  // derivado até mesRef (ou mês atual se omitido):
  saldo_atual: number
  total_investido: number
  total_rendimentos: number
  rentabilidade_pct: number
}>
```

### Movimentações

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/investimentos/movimentacoes` | Lista movimentações filtradas |
| POST | `/api/investimentos/movimentacoes` | Registra movimentação |
| DELETE | `/api/investimentos/movimentacoes/:id` | Remove movimentação |

**GET `/api/investimentos/movimentacoes?investimentoId=&mesRef=&tipo=`**
Response:
```typescript
Array<{
  id: number
  investimentoId: number
  mesRef: string
  tipo: 'APORTE' | 'RENDIMENTO' | 'RESGATE'
  valor: number
  notas: string | null
  // join:
  posicao: { categoria: string; instituicao: string }
}>
```

### Evolução patrimonial

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/investimentos/evolucao` | Saldo acumulado mês a mês |

**GET `/api/investimentos/evolucao?meses=12&pessoaId=`**
Response:
```typescript
Array<{
  mesRef: string
  saldo: number        // patrimônio total naquele mês
  aportes: number      // Σ APORTE daquele mês
  rendimentos: number  // Σ RENDIMENTO daquele mês
  resgates: number     // Σ RESGATE daquele mês
}>
```

---

## Frontend — novo layout de `/investimentos`

### Estrutura de seções

```
┌─────────────────────────────────────────────────────────────┐
│ PageHeader: "Investimentos" / "Posições e rendimentos"       │
├─────────────────────────────────────────────────────────────┤
│ [Tabs por pessoa — se mais de 1]                             │
├──────────────────────┬──────────────────────────────────────┤
│ HERO: Patrimônio      │ KPI: Aporte do mês                  │
│ Total (saldo atual)   │ KPI: Rendimentos do mês             │
│                       │ KPI: Rentabilidade % (acumulada)    │
├──────────────────────┴──────────────────────────────────────┤
│ [Botões] "+ Nova posição"   "+ Registrar movimentação"       │
├─────────────────────────────────┬───────────────────────────┤
│ Evolução patrimonial 12m        │ Distribuição por categoria │
│ AreaChart: saldo + aportes mês  │ PieChart: saldo por cat    │
├─────────────────────────────────┴───────────────────────────┤
│ POSIÇÕES                                [filtro: ativo/todos]│
│ Tabela: categoria | instituição | investido | rendimentos    │
│         rentabilidade % | saldo atual | ações                │
│ (expandível → mostra histórico de movimentações da posição)  │
├─────────────────────────────────────────────────────────────┤
│ MOVIMENTAÇÕES DO MÊS (mesRef selecionado)                    │
│ Tabela: data | posição | tipo | valor | notas               │
└─────────────────────────────────────────────────────────────┘
```

### Modais

**Modal "Nova posição":**
- Categoria (select: CATEGORIAS_INVESTIMENTO)
- Instituição (text input)
- Pessoa (select, se múltiplas pessoas)
- Notas (textarea opcional)

**Modal "Registrar movimentação":**
- Posição (select das posições ativas)
- Tipo (radio: Aporte / Rendimento / Resgate)
- Valor (R$)
- Mês de referência (YYYY-MM — pré-preenchido com mesRef atual)
- Notas (opcional)

---

## Agente 1 – Product Owner

- Name: `product-owner-invest-agent`
- Model: Sonnet
- Ferramentas: leitura em `docs/user-stories/`, `CLAUDE.md`
- Output: `docs/user-stories/invest-refactor.md`, atualizações em `docs/status.md`
- Responsabilidades:
  - Ler `CLAUDE.md`, `docs/user-stories/README.md` e `docs/user-stories/decisions.md` imediatamente ao iniciar
  - Validar que o novo modelo (Posição + Movimentações) cobre os casos de uso do domínio de investimentos descritos em `CLAUDE.md`
  - Publicar em `docs/user-stories/invest-refactor.md` as user stories da nova funcionalidade no formato padrão do projeto
  - Confirmar em `docs/status.md` que a migração de dados não perde informação dos snapshots existentes
  - Ficar disponível para responder dúvidas dos agentes de backend e frontend sobre regras de negócio
  - Registrar decisões não-triviais em `docs/user-stories/decisions.md`
  - Em conflito de escopo, a decisão do product-owner-invest-agent é final para este time

---

## Agente 2 – Architect

- Name: `architect-invest-agent`
- Model: Sonnet
- Base: `ARQUITETURA.md`, `CLAUDE.md`, ADRs em `docs/adr/`, `apps/api/prisma/schema.prisma`
- Output: novo ADR em `docs/adr/adr-investimentos-v2.md`, atualização de `docs/erd.md`, `docs/status.md`
- Responsabilidades:
  - Ler `ARQUITETURA.md`, `CLAUDE.md`, `apps/api/prisma/schema.prisma` e `docs/erd.md` imediatamente ao iniciar
  - Projetar e publicar em `docs/adr/adr-investimentos-v2.md`:
    - Novo schema Prisma (`Investimento` refatorado + `MovimentacaoInvestimento`)
    - Unique constraints e índices
    - Script de migração Prisma (nova migration `20260527000000_investimento_posicao_movimentacao`)
    - Script SQL de seed de migração de dados (converter snapshots antigos para posições + movimentações)
    - Contratos de interface `IInvestimentoRepository` e `IMovimentacaoInvestimentoRepository`
  - Atualizar `docs/erd.md` com as novas entidades
  - Validar que `domain/` não importa Prisma, que `toDomain()` fica inline nos repos, que `mesRef` = `YYYY-MM`
  - Revisar diffs de backend-agent e frontend-agent conforme chegarem com status `IMPLEMENTADO`
  - Reportar violações em `docs/adr/invest-review-log.md` com arquivo, linha, regra violada
  - Atualizar `docs/status.md` para `APROVADO` quando entrega passar
  - **Nunca implementar correções diretamente**

---

## Agente 3 – Backend Developer

- Name: `backend-invest-agent`
- Model: Sonnet
- Output: código em `apps/api/src/modules/finances/`, migration Prisma, `docs/api-contracts/investimentos-v2.md`
- Base: `CLAUDE.md`, `ARQUITETURA.md`, `docs/adr/adr-investimentos-v2.md` (publicado pelo architect-invest-agent)
- Responsabilidades:
  - Aguardar `architect-invest-agent` publicar `docs/adr/adr-investimentos-v2.md` com status `CONTRATO PUBLICADO`
  - Implementar na ordem:
    1. **Schema Prisma**: atualizar `apps/api/prisma/schema.prisma` com `Investimento` refatorado e `MovimentacaoInvestimento`
    2. **Migration**: criar `apps/api/prisma/migrations/20260527000000_investimento_posicao_movimentacao/migration.sql` com DDL + script de migração de dados
    3. **Domain entities**: `Investimento.ts` (posição), `MovimentacaoInvestimento.ts`
    4. **Repository interfaces**: `IInvestimentoRepository.ts`, `IMovimentacaoInvestimentoRepository.ts`
    5. **Use cases**:
       - `list-posicoes.use-case.ts` — retorna posições com métricas derivadas
       - `create-posicao.use-case.ts`
       - `update-posicao.use-case.ts`
       - `deactivate-posicao.use-case.ts` (soft delete: `ativo=false`)
       - `list-movimentacoes.use-case.ts`
       - `create-movimentacao.use-case.ts`
       - `delete-movimentacao.use-case.ts`
       - `get-evolucao.use-case.ts` — saldo acumulado por mês
    6. **Repos Prisma**: `prisma-investimento.repository.ts` (reescrever), `prisma-movimentacao-investimento.repository.ts`
    7. **Routes**: `investimentos.routes.ts` (reescrever) expondo os endpoints descritos nos contratos
    8. **Module**: atualizar `buildFinancesModule()` para registrar novos use cases e repos
  - Publicar `docs/api-contracts/investimentos-v2.md` com shape exato de request/response assim que interfaces estiverem definidas — antes da implementação completa
  - Atualizar `docs/status.md` para `CONTRATO PUBLICADO` após publicar contratos
  - Garantir que `npm run build` passa em `apps/api` antes de marcar qualquer módulo como `IMPLEMENTADO`
  - Registrar decisões em `docs/user-stories/decisions.md` via product-owner-invest-agent
  - **Regras invioláveis**: `domain/` nunca importa Fastify/Prisma, `HttpError` direto nos use cases, `toDomain()` inline, `mesRef` = `YYYY-MM`, valores Float (não centavos)

---

## Agente 4 – Frontend Developer

- Name: `frontend-invest-agent`
- Model: Sonnet
- Output: código em `apps/web/src/app/investimentos/`, `apps/web/src/mocks/investimentos.ts`
- Base: `CLAUDE.md`, `ARQUITETURA.md`, `docs/api-contracts/investimentos-v2.md`
- Responsabilidades:
  - Ler `CLAUDE.md`, `ARQUITETURA.md` e `apps/web/AGENTS.md` imediatamente ao iniciar
  - Iniciar pelo mock tipado enquanto aguarda `backend-invest-agent` publicar contratos:
    - Atualizar `apps/web/src/mocks/investimentos.ts` com tipos `PosicaoInvestimento`, `MovimentacaoInvestimento` e `EvolucaoPatrimonio`
    - Implementar UI completa consumindo mock, depois substituir por `apiFetch()` real
  - Monitorar `docs/status.md` — assim que `docs/api-contracts/investimentos-v2.md` aparecer com `CONTRATO PUBLICADO`, substituir mocks pelos calls reais
  - Implementar os seguintes arquivos:
    - `apps/web/src/app/investimentos/page.tsx` — Server Component (PageHeader)
    - `apps/web/src/app/investimentos/InvestimentosClient.tsx` — Client Component principal
    - `apps/web/src/app/investimentos/components/PosicaoCard.tsx` — card/linha de posição com métricas
    - `apps/web/src/app/investimentos/components/MovimentacaoForm.tsx` — modal de nova movimentação
    - `apps/web/src/app/investimentos/components/PosicaoForm.tsx` — modal de nova posição
    - `apps/web/src/app/investimentos/components/EvolucaoChart.tsx` — AreaChart com dados reais
    - `apps/web/src/app/investimentos/components/DistribuicaoChart.tsx` — PieChart com saldo por categoria
  - Usar paleta `--section-invest` (`#7B6EF5`) para accents da seção
  - **Preservar exatamente**:
    - Estrutura Server/Client Component (page.tsx = Server, lógica interativa = Client)
    - `apiFetch()` de `@/shared/lib/api` — sem hardcode de URL
    - `useMesRef()` para sincronizar com o mês selecionado globalmente
    - `toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })` para valores
    - `mesRef` como `YYYY-MM` em props e estado
  - Garantir responsividade (360px, 768px, 1280px+)
  - Rodar `npm run build` em `apps/web` antes de marcar como `IMPLEMENTADO`
  - Atualizar `docs/status.md` para `IMPLEMENTADO` ao concluir
  - **Remover** o `MOCK_EVOLUCAO_PATRIMONIO` hardcoded — chart deve usar dados reais da API

---

## Agente 5 – QA

- Name: `qa-invest-agent`
- Model: Sonnet
- Output: relatório em `docs/qa/qa-invest-[data].md`
- Base: `CLAUDE.md`, `docs/user-stories/invest-refactor.md`, `docs/api-contracts/investimentos-v2.md`
- Responsabilidades:
  - Aguardar módulos aparecerem como `APROVADO` pelo architect-invest-agent em `docs/status.md`
  - Testar endpoints:
    - `GET /api/investimentos/posicoes` — lista vazia, lista com dados, filtro por pessoaId
    - `POST /api/investimentos/posicoes` — happy path, categoria inválida, instituição vazia
    - `POST /api/investimentos/movimentacoes` — APORTE, RENDIMENTO, RESGATE; valor negativo (deve 400); mesRef inválido (deve 400)
    - `GET /api/investimentos/evolucao` — sem dados (array vazio), com 12 meses de histórico
    - `DELETE /api/investimentos/movimentacoes/:id` — 204 OK, 404 não encontrado
    - Desativar posição: `PUT posicoes/:id` com `ativo=false` → não deve aparecer em `GET` sem `?ativo=all`
  - Verificar métricas derivadas:
    - `saldo_atual` = soma correta de APORTE − RESGATE + RENDIMENTO
    - `rentabilidade_pct` = 0 quando não há RENDIMENTO
    - `evolucao` mês a mês acumula corretamente
  - Verificar frontend:
    - Gráfico de evolução carrega dados reais (sem `evolData: []`)
    - Modal de movimentação valida valor > 0 antes de salvar
    - Posição desativada some da lista de seleção no modal
    - `mesRef` chegando como `YYYY-MM` nos requests
    - Valores formatados como `R$ 1.234,56`
    - Build sem erros de hydration
  - Reportar bugs no formato obrigatório:
    - `arquivo:linha ❌ CRÍTICO: descrição. Reprodução: passo`
    - `arquivo:linha ⚠️ MÉDIO: descrição. Reprodução: passo`
    - `arquivo:linha 💡 BAIXO: descrição. Sugestão`
  - Atualizar `docs/status.md` para `APROVADO` ou `FALHOU` após cada ciclo
  - Resumo final: contagem por severidade + status `PASSOU`/`FALHOU` por módulo

---

## Lead

- Name: `lead-invest-agent`
- Model: Sonnet
- Output: relatório final em `docs/release/invest_v2.md`
- Responsabilidades:
  - Ler `CLAUDE.md`, `ARQUITETURA.md`, `docs/erd.md` imediatamente ao iniciar
  - Criar `docs/status.md` com estrutura inicial (se não existir) antes de disparar agentes
  - Disparar os 5 agentes simultaneamente
  - Monitorar `docs/status.md` para acompanhar progresso
  - Garantir dependência crítica: `backend-invest-agent` aguarda ADR do `architect-invest-agent`; `frontend-invest-agent` pode trabalhar com mock até contratos estarem prontos
  - Intervir quando módulo ficar `FALHOU` por mais de um ciclo
  - Garantir que `schema.prisma` e `docs/erd.md` ficam em sync após cada alteração de schema
  - Encerrar ciclo quando todos os módulos estiverem `APROVADO`
  - Consolidar relatório final com:
    - Módulos implementados
    - Schema changes (antes/depois)
    - Migração de dados (estratégia usada)
    - Endpoints novos vs removidos
    - Decisões de negócio tomadas no caminho
    - Bugs visuais/funcionais corrigidos
    - Próximos passos (ex: gráfico de rentabilidade por posição individual)
