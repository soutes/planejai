import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import type { ListOrcamentosUseCase } from '../application/use-cases/list-orcamentos.use-case.js'
import type { UpsertOrcamentoUseCase } from '../application/use-cases/upsert-orcamento.use-case.js'
import type { DeleteOrcamentoUseCase } from '../application/use-cases/delete-orcamento.use-case.js'

const OrcamentoSchema = z.object({
  id: z.number(),
  abaId: z.number(),
  mesRef: z.string().nullable(),
  categoria: z.string(),
  valorMeta: z.number(),
})

const UpsertBody = z.object({
  abaId: z.number().int().positive(),
  mesRef: z.string().regex(/^\d{4}-\d{2}$/).nullable().optional(),
  categoria: z.string().min(1),
  valorMeta: z.number().positive(),
})

const IdParam = z.object({ id: z.coerce.number().int().positive() })
const ListQuery = z.object({
  abaId: z.coerce.number().int().positive().optional(),
  mesRef: z.string().regex(/^\d{4}-\d{2}$/).optional(),
})

export interface OrcamentosRoutesDeps {
  listOrcamentos: ListOrcamentosUseCase
  upsertOrcamento: UpsertOrcamentoUseCase
  deleteOrcamento: DeleteOrcamentoUseCase
}

export const orcamentosRoutes: FastifyPluginAsyncZod<OrcamentosRoutesDeps> = async (app, deps) => {
  app.get(
    '/orcamentos',
    { schema: { querystring: ListQuery, response: { 200: z.array(OrcamentoSchema) } } },
    async (req) => deps.listOrcamentos.execute(req.query),
  )

  app.put(
    '/orcamentos',
    { schema: { body: UpsertBody, response: { 200: OrcamentoSchema } } },
    async (req) => deps.upsertOrcamento.execute(req.body),
  )

  app.delete(
    '/orcamentos/:id',
    { schema: { params: IdParam, response: { 204: z.null() } } },
    async (req, reply) => {
      await deps.deleteOrcamento.execute(req.params.id)
      return reply.status(204).send(null)
    },
  )
}
