# QA Report — Backend Setup / Módulos Ausentes
Data: 2026-05-20
Agente: qa-agent
Tipo: Análise estática (pré-aprovação architect)

## Resultado: FALHOU

## Módulos completamente ausentes

apps/api/src/shared/errors.ts:1 ❌ CRÍTICO: `HttpError` não possui os métodos estáticos definidos no contrato CLAUDE.md (`static notFound()`, `static badRequest()`, `static conflict()`, `static unprocessable()`). Use cases instanciam `new HttpError(404, msg)` diretamente, tornando o código inconsistente. Sem impacto funcional direto, mas viola o contrato arquitetural e dificulta manutenção.

apps/api/src/modules/finances/finances.module.ts:64 ❌ CRÍTICO: Módulo de **Faturas** completamente ausente. US-04 requer:
- `GET /api/faturas?cartaoId=`
- `GET /api/faturas/:id`
- `DELETE /api/faturas/:id`
- `GET /api/faturas/:id/transacoes`
- `PUT /api/faturas/:id/transacoes` (edição de categorias em lote)
Nenhum desses endpoints está implementado nem registrado no módulo.

apps/api/src/modules/finances/finances.module.ts:64 ❌ CRÍTICO: Módulo de **SnapshotCiclo** completamente ausente. US-05 requer:
- `GET /api/snapshots?cartaoId=&ref=`
- `POST /api/snapshots`
- `DELETE /api/snapshots/:id`
Nenhum desses endpoints existe.

apps/api/src/modules/finances/finances.module.ts:64 ❌ CRÍTICO: Módulo de **DivisaoEntry (splits)** completamente ausente. US-09 requer:
- `GET /api/divisao?pessoaId=&quitado=`
- `POST /api/divisao`
- `PUT /api/divisao/:id` (quitar)
Nenhum desses endpoints existe.

apps/api/src/ ❌ CRÍTICO: Bounded context `intelligence` completamente ausente. US-04 e US-07 requerem:
- `POST /api/intelligence/analyze-pdf`
- `POST /api/intelligence/analyze-image`
- `POST /api/intelligence/report`
Nenhum arquivo de intelligence existe em `apps/api/src/modules/`.

apps/api/src/modules/finances/application/use-cases/delete-categoria.use-case.ts:10 ⚠️ MÉDIO: Double fetch desnecessário — `findById` é chamado duas vezes (linha 8 e linha 10). O resultado de `existing` já contém `permanente`, mas o código faz uma segunda query redundante. Sem impacto funcional, mas desperdiça uma query de banco.

## Happy path testado (estático)
- [x] Setup Fastify app — existe em app.ts com error handler
- [x] CORS configurado — presente
- [x] Zod type provider — presente
- [x] Health endpoint — `GET /health` presente em app.ts
- [ ] Módulo Faturas — ausente
- [ ] Módulo SnapshotCiclo — ausente
- [ ] Módulo DivisaoEntry — ausente
- [ ] Módulo Intelligence — ausente
- [ ] HttpError com métodos estáticos — ausente
