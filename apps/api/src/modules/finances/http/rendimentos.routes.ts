import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import type { ListRendimentosUseCase } from '../application/use-cases/list-rendimentos.use-case.js'
import type { CreateRendimentoUseCase } from '../application/use-cases/create-rendimento.use-case.js'
import type { UpdateRendimentoUseCase } from '../application/use-cases/update-rendimento.use-case.js'
import type { DeleteRendimentoUseCase } from '../application/use-cases/delete-rendimento.use-case.js'

const RendimentoSchema = z.object({
  id: z.number(),
  mesRef: z.string(),
  descricao: z.string(),
  categoria: z.string(),
  valor: z.number(),
  recorrente: z.boolean(),
  totalRepeticoes: z.number().nullable(),
  origemId: z.number().nullable(),
})

const CreateBody = z.object({
  mesRef: z.string().regex(/^\d{4}-\d{2}$/),
  descricao: z.string().min(1),
  categoria: z.string().optional(),
  valor: z.number().positive(),
  recorrente: z.boolean().optional(),
  totalRepeticoes: z.number().int().positive().nullable().optional(),
})

const UpdateBody = z.object({
  descricao: z.string().min(1).optional(),
  categoria: z.string().optional(),
  valor: z.number().positive().optional(),
  recorrente: z.boolean().optional(),
})

const IdParam = z.object({ id: z.coerce.number().int().positive() })
const ListQuery = z.object({ mesRef: z.string().regex(/^\d{4}-\d{2}$/).optional() })

export interface RendimentosRoutesDeps {
  listRendimentos: ListRendimentosUseCase
  createRendimento: CreateRendimentoUseCase
  updateRendimento: UpdateRendimentoUseCase
  deleteRendimento: DeleteRendimentoUseCase
}

export const rendimentosRoutes: FastifyPluginAsyncZod<RendimentosRoutesDeps> = async (app, deps) => {
  app.get(
    '/rendimentos',
    { schema: { querystring: ListQuery, response: { 200: z.array(RendimentoSchema) } } },
    async (req) => deps.listRendimentos.execute(req.query),
  )

  app.post(
    '/rendimentos',
    { schema: { body: CreateBody, response: { 201: RendimentoSchema } } },
    async (req, reply) => reply.status(201).send(await deps.createRendimento.execute(req.body)),
  )

  app.put(
    '/rendimentos/:id',
    { schema: { params: IdParam, body: UpdateBody, response: { 200: RendimentoSchema } } },
    async (req) => deps.updateRendimento.execute(req.params.id, req.body),
  )

  app.delete(
    '/rendimentos/:id',
    {
      schema: {
        params: IdParam,
        querystring: z.object({ serie: z.coerce.boolean().optional() }),
        response: { 204: z.null() },
      },
    },
    async (req, reply) => {
      await deps.deleteRendimento.execute(req.params.id, req.query.serie)
      return reply.status(204).send(null)
    },
  )
}
