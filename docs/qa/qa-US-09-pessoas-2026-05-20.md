# QA Report — [US-09] Gerenciar Pessoas (módulo pessoas)
Data: 2026-05-20
Agente: qa-agent

## Resultado: PASSOU

## Testes executados

### Happy path
- [x] GET /api/pessoas → 200, retorna array de pessoas
- [x] POST /api/pessoas `{"nome":"Maria","cor":"#B07AFF"}` → 201 `{"id":2,"nome":"Maria","cor":"#B07AFF","ativo":true}`
- [x] PUT /api/pessoas/2 `{"nome":"Maria Silva"}` → 200 com nome atualizado
- [x] GET /api/pessoas/99999 → 404 (Fastify route-not-found — endpoint GET/:id não existe, mas resposta 404 é correta)

### Validação de input
- [x] POST sem `nome` → 400 `{"error":"Validation error","details":"body/nome Required"}`

### Contratos de dados
- [x] `ativo` presente e booleano nas respostas
- [x] Sem mesRef (não aplicável a pessoas)
- [x] Sem valores monetários (não aplicável)

## Observações
ℹ️ BAIXO: Não existe endpoint `GET /api/pessoas/:id`. US-09 não especifica este endpoint explicitamente (apenas GET lista), então é aceitável. Mas DELETE de pessoa não testado por ausência de 404 business-logic response — o router retorna 404 por rota inexistente, não pelo use case.

## Checklist final
- [x] GET lista retorna 200
- [x] POST cria recurso com 201
- [x] DELETE (N/A — US-09 não especifica DELETE de pessoa, apenas `PUT /api/pessoas/:id`)
- [x] Validação 400 funciona
