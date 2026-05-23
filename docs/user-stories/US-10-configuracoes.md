# US-10: Configurar categorias, abas e metas

**Como** usuário, **quero** personalizar categorias de despesa, criar abas (grupos de gasto), e definir metas mensais por categoria, **para** adaptar o app à minha realidade financeira.

## Telas relacionadas
`/gestao` — seções de categorias, abas e orçamentos

## Fluxo principal

### Categorias
1. Usuário vê categorias padrão (Alimentação, Transporte, Saúde, etc.) — não deletáveis
2. Adiciona categoria customizada: nome + ícone
3. Desativa categoria não-padrão (soft-delete)

### Abas de despesa
1. Usuário vê abas existentes (Pessoal, Familiar por padrão)
2. Adiciona nova aba: nome, ícone, cor
3. Configura `splitDestinoCategoria`: se definida, despesas desta aba geram split automático
4. Associa pessoas à aba com ratio padrão

### Orçamentos / Metas
1. Usuário define meta de gasto por categoria e mês (ou meta padrão sem mês)
2. Dashboard e página de despesas comparam real vs meta
3. Alerta visual quando categoria ultrapassa a meta

## Endpoints

### Categorias
- `GET /api/categorias`
- `POST /api/categorias`
- `PUT /api/categorias/:id` → `{ ativo: false }` — desativar (soft-delete, só para categorias não-padrão)

### Abas de despesa
- `GET /api/abas`
- `POST /api/abas` → `{ nome, icone, cor, splitDestinoCategoria? }`
- `PUT /api/abas/:id` → edição de nome, ícone, cor, splitDestinoCategoria

### Orçamentos / Metas
- `GET /api/orcamentos?abaId=&mesRef=`
- `PUT /api/orcamentos` (upsert por `abaId + mesRef + categoria`)

## Notas de produto
- Categorias padrão (`padrao=true`): não deletáveis, aparecerão sempre
- Aba com `splitDestinoCategoria`: quando despesa desta aba tem `DespesaSplit`, gera uma cópia `split_auto` na aba Pessoal na categoria indicada
- Meta sem `mesRef`: é meta padrão (fallback quando não há meta específica do mês)
- API key Anthropic: configurada via `.env` no backend — não exposta na UI

## Fora do escopo
- Regras de categorização automática na UI (CategoryRule existe no banco mas sem UI no MVP)
- Importar/exportar configurações
- Temas de cor do app
- Configuração de day fechamento do cartão via UI (feito direto no banco no MVP)
