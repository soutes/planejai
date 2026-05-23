import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import type { ListInvestimentosUseCase } from '../application/use-cases/list-investimentos.use-case.js'
import type { UpsertInvestimentoUseCase } from '../application/use-cases/upsert-investimento.use-case.js'
import type { DeleteInvestimentoUseCase } from '../application/use-cases/delete-investimento.use-case.js'

const InvestimentoSchema = z.object({
  id: z.number(),
  mesRef: z.string(),
  categoria: z.string(),
  instituicao: z.string(),
  valor: z.number(),
  aporteMe: z.number(),
  notas: z.string().nullable(),
})

const UpsertBody = z.object({
  mesRef: z.string().regex(/^\d{4}-\d{2}$/),
  categoria: z.string().min(1),
  instituicao: z.string().optional(),
  valor: z.number().min(0),
  aporteMe: z.number().min(0).optional(),
  notas: z.string().nullable().optional(),
})

const IdParam = z.object({ id: z.coerce.number().int().positive() })
const ListQuery = z.object({ mesRef: z.string().regex(/^\d{4}-\d{2}$/).optional() })

export interface InvestimentosRoutesDeps {
  listInvestimentos: ListInvestimentosUseCase
  upsertInvestimento: UpsertInvestimentoUseCase
  deleteInvestimento: DeleteInvestimentoUseCase
}

export const investimentosRoutes: FastifyPluginAsyncZod<InvestimentosRoutesDeps> = async (app, deps) => {
  app.get(
    '/investimentos',
    { schema: { querystring: ListQuery, response: { 200: z.array(InvestimentoSchema) } } },
    async (req) => deps.listInvestimentos.execute(req.query),
  )

  app.post(
    '/investimentos',
    { schema: { body: UpsertBody, response: { 200: InvestimentoSchema } } },
    async (req) => deps.upsertInvestimento.execute(req.body),
  )

  app.delete(
    '/investimentos/:id',
    { schema: { params: IdParam, response: { 204: z.null() } } },
    async (req, reply) => {
      await deps.deleteInvestimento.execute(req.params.id)
      return reply.status(204).send(null)
    },
  )
}
