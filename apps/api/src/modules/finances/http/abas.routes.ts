import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import type { ListAbasUseCase } from '../application/use-cases/list-abas.use-case.js'
import type { CreateAbaUseCase } from '../application/use-cases/create-aba.use-case.js'
import type { UpdateAbaUseCase } from '../application/use-cases/update-aba.use-case.js'
import type { DeleteAbaUseCase } from '../application/use-cases/delete-aba.use-case.js'

const AbaSchema = z.object({
  id: z.number(),
  nome: z.string(),
  icon: z.string(),
  cor: z.string(),
  ordem: z.number(),
  splitDestinoCategoria: z.string().nullable(),
  ativo: z.boolean(),
  pessoaId: z.number().nullable(),
})

const CreateBody = z.object({
  nome: z.string().min(1),
  icon: z.string().optional(),
  cor: z.string().optional(),
  ordem: z.number().int().optional(),
  splitDestinoCategoria: z.string().nullable().optional(),
})

const UpdateBody = z.object({
  nome: z.string().min(1).optional(),
  icon: z.string().optional(),
  cor: z.string().optional(),
  ordem: z.number().int().optional(),
  splitDestinoCategoria: z.string().nullable().optional(),
  ativo: z.boolean().optional(),
})

const IdParam = z.object({ id: z.coerce.number().int().positive() })

export interface AbasRoutesDeps {
  listAbas: ListAbasUseCase
  createAba: CreateAbaUseCase
  updateAba: UpdateAbaUseCase
  deleteAba: DeleteAbaUseCase
}

export const abasRoutes: FastifyPluginAsyncZod<AbasRoutesDeps> = async (app, deps) => {
  app.get(
    '/abas',
    { schema: { response: { 200: z.array(AbaSchema) } } },
    async () => deps.listAbas.execute(),
  )

  app.post(
    '/abas',
    { schema: { body: CreateBody, response: { 201: AbaSchema } } },
    async (req, reply) => reply.status(201).send(await deps.createAba.execute(req.body)),
  )

  app.put(
    '/abas/:id',
    { schema: { params: IdParam, body: UpdateBody, response: { 200: AbaSchema } } },
    async (req) => deps.updateAba.execute(req.params.id, req.body),
  )

  app.delete(
    '/abas/:id',
    { schema: { params: IdParam } },
    async (req, reply) => {
      await deps.deleteAba.execute(req.params.id)
      return reply.status(204).send()
    },
  )
}
