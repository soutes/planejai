import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import type { ListRegrasFixasUseCase } from '../application/use-cases/list-regras-fixas.use-case.js'
import type { CreateRegraFixaUseCase } from '../application/use-cases/create-regra-fixa.use-case.js'
import type { UpdateRegraFixaUseCase } from '../application/use-cases/update-regra-fixa.use-case.js'
import type { DeleteRegraFixaUseCase } from '../application/use-cases/delete-regra-fixa.use-case.js'

const RegraFixaSchema = z.object({
  id: z.number(),
  abaId: z.number(),
  descricao: z.string(),
  categoria: z.string(),
  valor: z.number(),
  diaVencimento: z.number().nullable(),
  ativo: z.boolean(),
})

const CreateBody = z.object({
  abaId: z.number().int().positive(),
  descricao: z.string().min(1),
  categoria: z.string().min(1),
  valor: z.number().positive(),
  diaVencimento: z.number().int().min(1).max(31).nullable().optional(),
})

const UpdateBody = z.object({
  descricao: z.string().min(1).optional(),
  categoria: z.string().min(1).optional(),
  valor: z.number().positive().optional(),
  diaVencimento: z.number().int().min(1).max(31).nullable().optional(),
  ativo: z.boolean().optional(),
})

const IdParam = z.object({ id: z.coerce.number().int().positive() })

export interface RegrasFixasRoutesDeps {
  listRegrasFixas: ListRegrasFixasUseCase
  createRegraFixa: CreateRegraFixaUseCase
  updateRegraFixa: UpdateRegraFixaUseCase
  deleteRegraFixa: DeleteRegraFixaUseCase
}

export const regrasFixasRoutes: FastifyPluginAsyncZod<RegrasFixasRoutesDeps> = async (app, deps) => {
  app.get(
    '/regras-fixas',
    { schema: { response: { 200: z.array(RegraFixaSchema) } } },
    async () => deps.listRegrasFixas.execute(),
  )

  app.post(
    '/regras-fixas',
    { schema: { body: CreateBody, response: { 201: RegraFixaSchema } } },
    async (req, reply) => reply.status(201).send(await deps.createRegraFixa.execute(req.body)),
  )

  app.put(
    '/regras-fixas/:id',
    { schema: { params: IdParam, body: UpdateBody, response: { 200: RegraFixaSchema } } },
    async (req) => deps.updateRegraFixa.execute(req.params.id, req.body),
  )

  app.delete(
    '/regras-fixas/:id',
    { schema: { params: IdParam, response: { 204: z.null() } } },
    async (req, reply) => {
      await deps.deleteRegraFixa.execute(req.params.id)
      return reply.status(204).send(null)
    },
  )
}
