import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import type { ListCategoryRulesUseCase } from '../application/use-cases/list-category-rules.use-case.js'
import type { CreateCategoryRuleUseCase } from '../application/use-cases/create-category-rule.use-case.js'
import type { UpdateCategoryRuleUseCase } from '../application/use-cases/update-category-rule.use-case.js'
import type { DeleteCategoryRuleUseCase } from '../application/use-cases/delete-category-rule.use-case.js'

const CategoryRuleSchema = z.object({
  id: z.number(),
  pattern: z.string(),
  categoria: z.string(),
  createdAt: z.string(),
})

const CreateBody = z.object({
  pattern: z.string().min(1),
  categoria: z.string().min(1),
})

const UpdateBody = z.object({
  pattern: z.string().min(1).optional(),
  categoria: z.string().min(1).optional(),
})

const IdParam = z.object({ id: z.coerce.number().int().positive() })

export interface CategoryRulesRoutesDeps {
  listCategoryRules: ListCategoryRulesUseCase
  createCategoryRule: CreateCategoryRuleUseCase
  updateCategoryRule: UpdateCategoryRuleUseCase
  deleteCategoryRule: DeleteCategoryRuleUseCase
}

export const categoryRulesRoutes: FastifyPluginAsyncZod<CategoryRulesRoutesDeps> = async (app, deps) => {
  app.get(
    '/category-rules',
    { schema: { response: { 200: z.array(CategoryRuleSchema) } } },
    async () => deps.listCategoryRules.execute(),
  )

  app.post(
    '/category-rules',
    { schema: { body: CreateBody, response: { 201: CategoryRuleSchema } } },
    async (req, reply) => reply.status(201).send(await deps.createCategoryRule.execute(req.body)),
  )

  app.put(
    '/category-rules/:id',
    { schema: { params: IdParam, body: UpdateBody, response: { 200: CategoryRuleSchema } } },
    async (req) => deps.updateCategoryRule.execute(req.params.id, req.body),
  )

  app.delete(
    '/category-rules/:id',
    { schema: { params: IdParam, response: { 204: z.null() } } },
    async (req, reply) => {
      await deps.deleteCategoryRule.execute(req.params.id)
      return reply.status(204).send(null)
    },
  )
}
