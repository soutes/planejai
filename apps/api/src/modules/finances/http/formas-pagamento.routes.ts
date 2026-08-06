import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import type { ListFormasPagamentoUseCase } from '../application/use-cases/list-formas-pagamento.use-case.js'
import type { UpsertFormaPagamentoUseCase } from '../application/use-cases/upsert-forma-pagamento.use-case.js'

const FormaPagamentoSchema = z.object({
  id: z.number(),
  pessoaId: z.number(),
  nome: z.string(),
  ativo: z.boolean(),
  ordem: z.number(),
})

const ListQuery = z.object({
  pessoaId: z.coerce.number().int().positive(),
})

const CreateBody = z.object({
  pessoaId: z.number().int().positive(),
  nome: z.string().min(1),
})

export interface FormasPagamentoRoutesDeps {
  listFormasPagamento: ListFormasPagamentoUseCase
  upsertFormaPagamento: UpsertFormaPagamentoUseCase
}

export const formasPagamentoRoutes: FastifyPluginAsyncZod<FormasPagamentoRoutesDeps> = async (app, deps) => {
  app.get(
    '/formas-pagamento',
    { schema: { querystring: ListQuery, response: { 200: z.array(FormaPagamentoSchema) } } },
    async (req) => deps.listFormasPagamento.execute({ pessoaId: req.query.pessoaId }),
  )

  app.post(
    '/formas-pagamento',
    { schema: { body: CreateBody, response: { 200: FormaPagamentoSchema, 201: FormaPagamentoSchema } } },
    async (req, reply) => {
      const { forma, created } = await deps.upsertFormaPagamento.execute(req.body)
      return reply.status(created ? 201 : 200).send(forma)
    },
  )
}
