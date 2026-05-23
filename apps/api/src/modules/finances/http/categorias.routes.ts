import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import type { ListCategoriasUseCase } from '../application/use-cases/list-categorias.use-case.js'
import type { CreateCategoriaUseCase } from '../application/use-cases/create-categoria.use-case.js'
import type { UpdateCategoriaUseCase } from '../application/use-cases/update-categoria.use-case.js'
import type { DeleteCategoriaUseCase } from '../application/use-cases/delete-categoria.use-case.js'

const CategoriaSchema = z.object({
  id: z.number(),
  nome: z.string(),
  icon: z.string(),
  padrao: z.boolean(),
  permanente: z.boolean(),
  ativa: z.boolean(),
})

const CreateBody = z.object({
  nome: z.string().min(1),
  icon: z.string().optional(),
  padrao: z.boolean().optional(),
  permanente: z.boolean().optional(),
})

const UpdateBody = z.object({
  nome: z.string().min(1).optional(),
  icon: z.string().optional(),
  ativa: z.boolean().optional(),
})

const IdParam = z.object({ id: z.coerce.number().int().positive() })

export interface CategoriasRoutesDeps {
  listCategorias: ListCategoriasUseCase
  createCategoria: CreateCategoriaUseCase
  updateCategoria: UpdateCategoriaUseCase
  deleteCategoria: DeleteCategoriaUseCase
}

export const categoriasRoutes: FastifyPluginAsyncZod<CategoriasRoutesDeps> = async (app, deps) => {
  app.get(
    '/categorias',
    { schema: { response: { 200: z.array(CategoriaSchema) } } },
    async () => deps.listCategorias.execute(),
  )

  app.post(
    '/categorias',
    { schema: { body: CreateBody, response: { 201: CategoriaSchema } } },
    async (req, reply) => reply.status(201).send(await deps.createCategoria.execute(req.body)),
  )

  app.put(
    '/categorias/:id',
    { schema: { params: IdParam, body: UpdateBody, response: { 200: CategoriaSchema } } },
    async (req) => deps.updateCategoria.execute(req.params.id, req.body),
  )

  app.delete(
    '/categorias/:id',
    { schema: { params: IdParam, response: { 204: z.null() } } },
    async (req, reply) => {
      await deps.deleteCategoria.execute(req.params.id)
      return reply.status(204).send(null)
    },
  )
}
