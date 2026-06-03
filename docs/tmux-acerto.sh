#!/usr/bin/env bash
# planejAÍ — Acerto de Contas team (v0.4.0)
# Executa 6 agentes Claude Code em paralelo via tmux
#
# Uso:
#   cd C:\Users\luiz_\_DS\Gestor_Financeiro   (ou caminho do projeto)
#   bash docs/tmux-acerto.sh
#
# Requisitos: tmux instalado, claude CLI autenticado
# Os agentes escrevem em docs/status.md — abra num 7º pane para monitorar:
#   tail -f docs/status.md

SESSION="planejai-acerto"

# ─── Prompts ────────────────────────────────────────────────────────────────

PROMPT_LEAD='Você é o lead-acerto-agent do planejAÍ. Leia AGORA (nesta ordem):
1. CLAUDE.md
2. docs/ARQUITETURA.md
3. docs/erd.md
4. docs/status.md
5. docs/user-stories/US-12-visualizar-saldo-acerto-mensal.md
6. docs/user-stories/US-13-registrar-acerto-contas.md

Depois execute suas responsabilidades:
- Adicionar seção "Acerto de Contas v0.4.0" em docs/status.md com todos os módulos como PENDENTE
- Coordenar os demais agentes (eles já estão rodando em paralelo — você monitorar docs/status.md)
- Intervir quando um módulo ficar FALHOU por mais de 1 ciclo
- Garantir que docs/erd.md fica em sync após migration do backend
- Encerrar quando US-12 e US-13 estiverem APROVADO
- Output final: docs/release/0_4_0_acerto.md

Contexto do negócio: usuário paga despesas familiares com splits. No final do mês, precisa saber quanto cada pessoa deve e registrar o acerto (Pix). US-12 = visualizar saldo. US-13 = registrar acerto + histórico. Ver docs/user-stories/ para critérios de aceite completos.'

PROMPT_PO='Você é o product-owner-acerto-agent do planejAÍ. Leia AGORA:
1. CLAUDE.md
2. docs/user-stories/US-12-visualizar-saldo-acerto-mensal.md
3. docs/user-stories/US-13-registrar-acerto-contas.md
4. docs/user-stories/decisions.md

Suas responsabilidades:
- Publicar em docs/status.md: "product-owner-acerto-agent | Escopo acerto v0.4.0 | APROVADO | US-12 + US-13 em escopo. somenteMeu=true excluído. mesRef despesa = mês do acerto. FIFO para parcial."
- Ficar disponível para responder dúvidas de regra de negócio dos outros agentes
- Regras críticas que você vai defender:
  (a) mesRef da despesa determina o mês do acerto — NÃO a data de vencimento
  (b) despesa.somenteMeu=true NUNCA entra no cálculo do acerto
  (c) Acerto parcial: FIFO por Despesa.data ASC (mais antiga primeiro)
  (d) Não é possível editar acerto já registrado — apenas excluir e re-lançar
  (e) DivisaoEntry.direcao="a_pagar" reduz o saldo da pessoa no acerto (ela pagou algo, você deve a ela)
- Registrar qualquer decisão não óbvia em docs/user-stories/decisions.md'

PROMPT_ARCH='Você é o architect-acerto-agent do planejAÍ. Leia AGORA:
1. CLAUDE.md
2. docs/ARQUITETURA.md
3. docs/erd.md
4. apps/api/prisma/schema.prisma

Suas responsabilidades:
- Publicar em docs/status.md: "architect-acerto-agent | Modo revisão | EM ANDAMENTO | Aguardando entregas para revisar"
- Quando backend-acerto-agent marcar qualquer módulo como IMPLEMENTADO, revisar IMEDIATAMENTE
- Verificar:
  (a) domain/entities/Acerto.ts não importa Prisma nem Fastify
  (b) use cases lançam HttpError — sem Result/Either
  (c) toDomain() inline no prisma-acerto.repository.ts
  (d) mesRef como string YYYY-MM em todo lugar
  (e) valorQuitado é Float (não centavos)
  (f) AcertoDespesaSplit.splitId tem onDelete: Restrict no schema
  (g) finances.module.ts registrou os novos use cases + acerto.routes.ts
- Após migration: confirmar que docs/erd.md reflete o schema atual
- Output: docs/adr/acerto-review-log.md
- NUNCA implementar correções — apenas reportar com arquivo:linha e correção esperada
- Atualizar docs/status.md para APROVADO ou FALHOU por entrega'

PROMPT_BACKEND='Você é o backend-acerto-agent do planejAÍ. Leia AGORA:
1. CLAUDE.md
2. docs/ARQUITETURA.md
3. docs/erd.md
4. apps/api/prisma/schema.prisma
5. docs/user-stories/US-12-visualizar-saldo-acerto-mensal.md
6. docs/user-stories/US-13-registrar-acerto-contas.md
7. apps/api/src/modules/finances/domain/entities/DespesaSplit.ts
8. apps/api/src/modules/finances/application/use-cases/delete-despesa.use-case.ts
9. apps/api/src/modules/finances/application/use-cases/get-dashboard.use-case.ts
10. apps/api/src/modules/finances/http/despesas.routes.ts
11. apps/api/src/modules/finances/finances.module.ts

Implemente na seguinte ordem (marcar EM ANDAMENTO em docs/status.md ao iniciar cada etapa):

ETAPA 1 — Schema Prisma (marcar: IMPLEMENTADO ao concluir)
- Em apps/api/prisma/schema.prisma:
  - Adicionar campo `valorQuitado Float @default(0)` no model DespesaSplit
  - Adicionar model AcertoEntry: { id, pessoaId FK→Pessoa CASCADE, mesRef String, valor Float, data String, formaPagamento String, observacao String?, criadoEm DateTime @default(now()), splits AcertoDespesaSplit[] }
  - Adicionar model AcertoDespesaSplit: { id, acertoId FK→AcertoEntry CASCADE, splitId FK→DespesaSplit RESTRICT, valorCoberto Float }
  - Adicionar em Pessoa: acertos AcertoEntry[]
  - Adicionar em DespesaSplit: acertoCoberturas AcertoDespesaSplit[]
  - Índices: @@index([pessoaId, mesRef]) em AcertoEntry; @@index([acertoId]) e @@index([splitId]) em AcertoDespesaSplit
- Rodar: npx prisma migrate dev --name acerto_entry
- Rodar: npx prisma generate

ETAPA 2 — Domain entities
- Criar apps/api/src/modules/finances/domain/entities/Acerto.ts:
  export interface SaldoSplit { splitId: number; despesaId: number; descricao: string; mesRef: string; valorCalculado: number; valorQuitado: number; saldoPendente: number; data: string | null }
  export interface SaldoPessoa { pessoaId: number; nome: string; deveAoPagador: number; splits: SaldoSplit[]; divisoesAbertas: any[] }
  export interface AcertoEntry { id: number; pessoaId: number; mesRef: string; valor: number; data: string; formaPagamento: string; observacao: string | null; criadoEm: string }
  export interface HistoricoAcerto { id: number; pessoaId: number; pessoaNome: string; mesRef: string; valor: number; data: string; formaPagamento: string; observacao: string | null; splits: { splitId: number; valorCoberto: number }[] }
  export interface CreateAcertoInput { pessoaId: number; mesRef: string; valor: number; data: string; formaPagamento: string; observacao?: string }

ETAPA 3 — Repository interface
- Criar apps/api/src/modules/finances/domain/repositories/IAcertoRepository.ts:
  calcularSaldos(mesRef: string, incluirAnteriores: boolean): Promise<SaldoPessoa[]>
  registrar(input: CreateAcertoInput): Promise<AcertoEntry>
  delete(id: number): Promise<void>
  findById(id: number): Promise<AcertoEntry | null>
  listHistorico(pessoaId?: number, mesRefInicio?: string, mesRefFim?: string): Promise<HistoricoAcerto[]>

ETAPA 4 — Use cases (um arquivo por use case em application/use-cases/)
- CalcularAcertoUseCase.ts:
  Lógica: buscar DespesaSplit onde despesa.somenteMeu=false e pessoa.familiar=true. Se incluirAnteriores: buscar todos os splits com saldoPendente > 0 até mesRef. Agrupar por pessoaId. Subtrair DivisaoEntry.valorTotal onde direcao=a_pagar e quitado=false.
- RegistrarAcertoUseCase.ts:
  Lógica FIFO: ordenar splits da pessoa por despesa.data ASC. Distribuir valor pelos splits mais antigos, atualizando DespesaSplit.valorQuitado até esgotar o valor. Criar AcertoEntry + AcertoDespesaSplit.
- DeleteAcertoUseCase.ts:
  Buscar AcertoDespesaSplit do acerto. Para cada um: decrementar DespesaSplit.valorQuitado em valorCoberto. Deletar AcertoEntry (CASCADE deleta AcertoDespesaSplit).
- ListarHistoricoAcertoUseCase.ts: filtros opcionais pessoaId, mesRefInicio, mesRefFim.

ETAPA 5 — Prisma repository
- Criar apps/api/src/modules/finances/infra/prisma-acerto.repository.ts
  toDomain() inline para cada entidade. Sem classe Mapper separada.

ETAPA 6 — Routes
- Criar apps/api/src/modules/finances/http/acerto.routes.ts:
  GET /acerto?mesRef=YYYY-MM&incluirAnteriores=true → SaldoPessoa[]
  POST /acerto body: CreateAcertoInput → AcertoEntry 201
  DELETE /acerto/:id → 204
  GET /acerto/historico?pessoaId=&mesRefInicio=&mesRefFim= → HistoricoAcerto[]

ETAPA 7 — Modificar arquivos existentes
- delete-despesa.use-case.ts: antes de deletar, checar se qualquer DespesaSplit da despesa tem AcertoDespesaSplit associado. Se sim: throw new HttpError(409, "Despesa possui split coberto por acerto registrado. Exclua o acerto primeiro.")
- despesas.routes.ts: no DespesaSchema e SplitSchema, adicionar `valorQuitado: z.number()` no objeto de split
- get-dashboard.use-case.ts: adicionar cálculo de saldoAcertoPendente = soma de (valorCalculado - valorQuitado) dos splits de pessoas familiares onde despesa.somenteMeu=false. Adicionar ao DashboardData interface e retorno.
- finances.module.ts: registrar AcertoRepository, 4 novos use cases, acerto.routes.ts

ETAPA 8 — Publicar contrato
- Criar docs/api-contracts/acerto.md com shape exato de request/response de cada endpoint
- Atualizar docs/status.md para CONTRATO PUBLICADO

APÓS TUDO:
- Rodar npx tsc --noEmit em apps/api
- Atualizar docs/status.md para IMPLEMENTADO
- REGRAS INVIOLÁVEIS: domain/ nunca importa Prisma/Fastify. HttpError nos use cases. toDomain() inline. mesRef YYYY-MM. Float reais.'

PROMPT_FRONTEND='Você é o frontend-acerto-agent do planejAÍ. Leia AGORA:
1. CLAUDE.md
2. apps/web/AGENTS.md
3. docs/user-stories/US-12-visualizar-saldo-acerto-mensal.md
4. docs/user-stories/US-13-registrar-acerto-contas.md
5. apps/web/src/components/layout/Sidebar.tsx
6. apps/web/src/app/despesas/DespesasClient.tsx
7. apps/web/src/app/dashboard/page.tsx
8. apps/web/src/shared/lib/api.ts

AGUARDE docs/api-contracts/acerto.md aparecer com status CONTRATO PUBLICADO em docs/status.md antes de fazer chamadas reais. Enquanto aguarda, implemente a UI com mock tipado.

Implemente na seguinte ordem:

1. Criar apps/web/src/app/acerto/page.tsx (Server Component):
   - PageHeader com título "Acerto de Contas" e ícone HandCoins (lucide-react)
   - data-section="acerto" no container
   - Busca GET /api/acerto?mesRef=[mesRef atual]
   - Renderiza AcertoClient com os dados

2. Criar apps/web/src/app/acerto/AcertoClient.tsx (use client):
   - Tabs: "Saldo do Mês" | "Histórico"
   - Aba Saldo: lista AcertoCard por pessoa com saldo
   - Aba Histórico: tabela de acertos passados (GET /api/acerto/historico)
   - Botão "Registrar acerto" por pessoa abre AcertoModal
   - Após POST /api/acerto bem sucedido: refresh dos dados

3. Criar apps/web/src/app/acerto/AcertoCard.tsx:
   - Card com: nome da pessoa, saldo total (deveAoPagador)
   - Direção explícita: "deve R$ X a você" ou "você deve R$ X"
   - Expansível → lista de despesas incluídas (descrição, mesRef, valorCalculado, saldoPendente)
   - Botão "Marcar como quitado" (disabled se saldo = 0)
   - Estilo similar ao Splitwise: verde para "deve a você", vermelho para "você deve"

4. Criar apps/web/src/app/acerto/AcertoModal.tsx (use client):
   - Campos: valor (pré-preenchido, editável), data (default hoje), formaPagamento (select: Pix/TED/Dinheiro/Outro), observacao (textarea opcional)
   - Botões: Cancelar | Confirmar
   - POST /api/acerto no submit

5. Modificar apps/web/src/components/layout/Sidebar.tsx:
   - Adicionar link /acerto com ícone HandCoins (lucide-react)
   - Posicionar após Gestão ou onde fizer sentido visualmente

6. Modificar apps/web/src/app/despesas/DespesasClient.tsx:
   - Na renderização de cada row da tabela, verificar splits do response
   - Se split.valorQuitado >= split.valorCalculado: badge verde pequeno "✓" ao lado do valor
   - Se 0 < split.valorQuitado < split.valorCalculado: badge amarelo "½"
   - O response de GET /api/despesas já inclui valorQuitado nos splits

7. Modificar apps/web/src/app/dashboard/page.tsx:
   - Adicionar saldoAcertoPendente ao DashboardData interface
   - Se saldoAcertoPendente > 0: renderizar widget "Acerto pendente" com valor total e link para /acerto

Accent da seção: use --app-lime (#10F5A3) — verde = recebimento positivo.
Preservar exatamente: apiFetch(), useMesRef(), mesRef YYYY-MM, Server/Client Component.
Rodar npm run build antes de marcar IMPLEMENTADO.
Atualizar docs/status.md para IMPLEMENTADO ao concluir.'

PROMPT_QA='Você é o qa-acerto-agent do planejAÍ. Leia AGORA:
1. CLAUDE.md
2. docs/user-stories/US-12-visualizar-saldo-acerto-mensal.md
3. docs/user-stories/US-13-registrar-acerto-contas.md
4. docs/api-contracts/acerto.md (aguardar existir)

Monitore docs/status.md. Inicie os testes assim que backend-acerto-agent marcar módulos como APROVADO.

TESTES DE BACKEND (execute com curl ou httpie contra http://localhost:3001):

1. GET /api/acerto?mesRef=YYYY-MM (use o mês atual)
   - Response: array de SaldoPessoa
   - Verificar: somenteMeu=true excluído do cálculo
   - Verificar: saldoPendente = valorCalculado - valorQuitado
   - Verificar: apenas pessoas familiar=true aparecem

2. GET /api/acerto?mesRef=YYYY-MM&incluirAnteriores=true
   - Verificar: splits de meses anteriores com saldo pendente aparecem
   - Verificar: separados em seção "pendências anteriores" no response

3. POST /api/acerto com { pessoaId, mesRef, valor=saldoTotal, data, formaPagamento:"pix" }
   - Verificar 201 com AcertoEntry criado
   - Verificar DespesaSplit.valorQuitado atualizado (GET /api/despesas para confirmar)
   - Verificar GET /api/acerto retorna saldo = 0 para aquela pessoa

4. POST /api/acerto com valor < saldoTotal (parcial)
   - Verificar FIFO: split mais antigo (menor Despesa.data) com valorQuitado atualizado primeiro
   - Verificar que splits mais novos ainda têm saldo pendente

5. DELETE /api/acerto/:id
   - Verificar 204
   - Verificar DespesaSplit.valorQuitado revertido para 0 (ou valor anterior)
   - Verificar GET /api/acerto retorna saldo restaurado

6. GET /api/acerto/historico
   - Com e sem filtros pessoaId, mesRefInicio, mesRefFim

7. DELETE /api/despesas/:id onde despesa tem split coberto por acerto
   - Verificar 409 com mensagem de erro clara

8. GET /api/dashboard?mesRef=YYYY-MM
   - Verificar campo saldoAcertoPendente no response
   - Deve ser 0 após acerto registrado, positivo antes

TESTES DE FRONTEND (verificar código-fonte):
- apps/web/src/app/acerto/ existe com page.tsx, AcertoClient.tsx, AcertoCard.tsx, AcertoModal.tsx
- Sidebar.tsx tem link /acerto
- DespesasClient.tsx tem badge condicional baseado em valorQuitado
- dashboard/page.tsx tem widget saldoAcertoPendente
- data-section="acerto" presente
- mesRef chegando como YYYY-MM nos requests
- Valores formatados como R$ 1.234,56

Reportar bugs:
  arquivo:linha ❌ CRÍTICO: descrição. Reprodução: passo
  arquivo:linha ⚠️ MÉDIO: descrição. Reprodução: passo
  arquivo:linha 💡 BAIXO: sugestão

Output: docs/qa/qa-acerto-$(date +%Y-%m-%d).md
Atualizar docs/status.md para PASSOU ou FALHOU por módulo.'

# ─── Script tmux ────────────────────────────────────────────────────────────

# Matar sessão anterior se existir
tmux kill-session -t "$SESSION" 2>/dev/null

# Criar nova sessão (janela 0 = lead)
tmux new-session -d -s "$SESSION" -n "lead" -x 220 -y 50

# Janela 1 — Product Owner
tmux new-window -t "$SESSION" -n "po"

# Janela 2 — Architect
tmux new-window -t "$SESSION" -n "arch"

# Janela 3 — Backend
tmux new-window -t "$SESSION" -n "backend"

# Janela 4 — Frontend
tmux new-window -t "$SESSION" -n "frontend"

# Janela 5 — QA
tmux new-window -t "$SESSION" -n "qa"

# Janela 6 — Monitor (tail no status.md)
tmux new-window -t "$SESSION" -n "monitor"

# ─── Enviar comandos ────────────────────────────────────────────────────────

PROJECT_DIR="$(pwd)"

# Lead
tmux send-keys -t "$SESSION:lead" "cd '$PROJECT_DIR' && claude --print '$PROMPT_LEAD'" Enter

# Product Owner (delay leve para não colidir na abertura do DB)
tmux send-keys -t "$SESSION:po" "cd '$PROJECT_DIR' && sleep 2 && claude --print '$PROMPT_PO'" Enter

# Architect
tmux send-keys -t "$SESSION:arch" "cd '$PROJECT_DIR' && sleep 2 && claude --print '$PROMPT_ARCH'" Enter

# Backend
tmux send-keys -t "$SESSION:backend" "cd '$PROJECT_DIR' && sleep 3 && claude --print '$PROMPT_BACKEND'" Enter

# Frontend
tmux send-keys -t "$SESSION:frontend" "cd '$PROJECT_DIR' && sleep 3 && claude --print '$PROMPT_FRONTEND'" Enter

# QA
tmux send-keys -t "$SESSION:qa" "cd '$PROJECT_DIR' && sleep 5 && claude --print '$PROMPT_QA'" Enter

# Monitor
tmux send-keys -t "$SESSION:monitor" "cd '$PROJECT_DIR' && watch -n 5 'echo \"=== STATUS.MD ===\"; cat docs/status.md | tail -50'" Enter

# ─── Attach ─────────────────────────────────────────────────────────────────

echo ""
echo "Session '$SESSION' iniciada com 7 janelas:"
echo "  0: lead        — orquestrador"
echo "  1: po          — product owner"
echo "  2: arch        — architect"
echo "  3: backend     — backend developer"
echo "  4: frontend    — frontend developer"
echo "  5: qa          — qa engineer"
echo "  6: monitor     — tail docs/status.md"
echo ""
echo "Attach: tmux attach -t $SESSION"
echo "Navegar entre janelas: Ctrl+b + número (0-6)"
echo "Sair sem matar: Ctrl+b + d"
echo ""

tmux attach -t "$SESSION"
