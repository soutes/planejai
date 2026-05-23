import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import type { ListCartoesUseCase } from '../application/use-cases/list-cartoes.use-case.js'
import type { CreateCartaoUseCase } from '../application/use-cases/create-cartao.use-case.js'
import type { UpdateCartaoUseCase } from '../application/use-cases/update-cartao.use-case.js'
import type { DeleteCartaoUseCase } from '../application/use-cases/delete-cartao.use-case.js'

const CartaoSchema = z.object({
  id: z.number(),
  nome: z.string(),
  proprietario: z.string().nullable(),
  finalDigitos: z.string().nullable(),
  cor: z.string(),
  limite: z.number().nullable(),
  diaFechamento: z.number(),
  ativo: z.boolean(),
  abaId: z.number().nullable(),
  abaPessoaId: z.number().nullable(),
})

const CreateBody = z.object({
  nome: z.string().min(1),
  proprietario: z.string().nullable().optional(),
  finalDigitos: z.string().nullable().optional(),
  cor: z.string().optional(),
  limite: z.number().positive().nullable().optional(),
  diaFechamento: z.number().int().min(1).max(31).optional(),
  abaId: z.number().int().positive().nullable().optional(),
})

const UpdateBody = z.object({
  nome: z.string().min(1).optional(),
  proprietario: z.string().nullable().optional(),
  finalDigitos: z.string().nullable().optional(),
  cor: z.string().optional(),
  limite: z.number().positive().nullable().optional(),
  diaFechamento: z.number().int().min(1).max(31).optional(),
  ativo: z.boolean().optional(),
  abaId: z.number().int().positive().nullable().optional(),
})

const IdParam = z.object({ id: z.coerce.number().int().positive() })

export interface CartoesRoutesDeps {
  listCartoes: ListCartoesUseCase
  createCartao: CreateCartaoUseCase
  updateCartao: UpdateCartaoUseCase
  deleteCartao: DeleteCartaoUseCase
}

export const cartoesRoutes: FastifyPluginAsyncZod<CartoesRoutesDeps> = async (app, deps) => {
  app.get(
    '/cartoes',
    { schema: { response: { 200: z.array(CartaoSchema) } } },
    async () => deps.listCartoes.execute(),
  )

  app.post(
    '/cartoes',
    { schema: { body: CreateBody, response: { 201: CartaoSchema } } },
    async (req, reply) => reply.status(201).send(await deps.createCartao.execute(req.body)),
  )

  app.put(
    '/cartoes/:id',
    { schema: { params: IdParam, body: UpdateBody, response: { 200: CartaoSchema } } },
    async (req) => deps.updateCartao.execute(req.params.id, req.body),
  )

  app.delete(
    '/cartoes/:id',
    { schema: { params: IdParam, response: { 204: z.null() } } },
    async (req, reply) => {
      await deps.deleteCartao.execute(req.params.id)
      return reply.status(204).send(null)
    },
  )
}
