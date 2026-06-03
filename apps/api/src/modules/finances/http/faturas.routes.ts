import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import type { ListFaturasUseCase } from '../application/use-cases/list-faturas.use-case.js'
import type { GetFaturaUseCase } from '../application/use-cases/get-fatura.use-case.js'
import type { DeleteFaturaUseCase } from '../application/use-cases/delete-fatura.use-case.js'
import type { ListTransacoesUseCase } from '../application/use-cases/list-transacoes.use-case.js'
import type { UpdateTransacaoUseCase } from '../application/use-cases/update-transacao.use-case.js'
import type { DeleteTransacaoUseCase } from '../application/use-cases/delete-transacao.use-case.js'

const FaturaSchema = z.object({
  id: z.number(),
  fileHash: z.string(),
  arquivoOriginal: z.string(),
  banco: z.string().nullable(),
  mesReferencia: z.string().nullable(),
  vencimento: z.string().nullable(),
  total: z.number().nullable(),
  limite: z.number().nullable(),
  comentarioExecutivo: z.string().nullable(),
  analiseJson: z.string(),
  criadoEm: z.string(),
  cartaoId: z.number(),
})

const TransacaoSchema = z.object({
  id: z.number(),
  faturaId: z.number(),
  data: z.string().nullable(),
  descricao: z.string().nullable(),
  estabelecimento: z.string().nullable(),
  valor: z.number().nullable(),
  categoria: z.string().nullable(),
  parcela: z.string().nullable(),
})

const IdParam = z.object({ id: z.coerce.number().int().positive() })
const TransacaoParam = z.object({
  id: z.coerce.number().int().positive(),
  transacaoId: z.coerce.number().int().positive(),
})

const ListQuery = z.object({
  cartaoId: z.coerce.number().int().positive().optional(),
})

const UpdateTransacaoBody = z.object({
  data: z.string().nullable().optional(),
  descricao: z.string().nullable().optional(),
  estabelecimento: z.string().nullable().optional(),
  valor: z.number().nullable().optional(),
  categoria: z.string().nullable().optional(),
  parcela: z.string().nullable().optional(),
})

export interface FaturasRoutesDeps {
  listFaturas: ListFaturasUseCase
  getFatura: GetFaturaUseCase
  deleteFatura: DeleteFaturaUseCase
  listTransacoes: ListTransacoesUseCase
  updateTransacao: UpdateTransacaoUseCase
  deleteTransacao: DeleteTransacaoUseCase
}

export const faturasRoutes: FastifyPluginAsyncZod<FaturasRoutesDeps> = async (app, deps) => {
  app.get(
    '/faturas',
    { schema: { querystring: ListQuery, response: { 200: z.array(FaturaSchema) } } },
    async (req) => deps.listFaturas.execute(req.query),
  )

  app.get(
    '/faturas/:id',
    { schema: { params: IdParam, response: { 200: FaturaSchema } } },
    async (req) => deps.getFatura.execute(req.params.id),
  )

  app.delete(
    '/faturas/:id',
    { schema: { params: IdParam } },
    async (req, reply) => {
      await deps.deleteFatura.execute(req.params.id)
      return reply.status(204).send(null)
    },
  )

  app.get(
    '/faturas/:id/transacoes',
    { schema: { params: IdParam, response: { 200: z.array(TransacaoSchema) } } },
    async (req) => deps.listTransacoes.execute(req.params.id),
  )

  app.put(
    '/faturas/:id/transacoes/:transacaoId',
    { schema: { params: TransacaoParam, body: UpdateTransacaoBody, response: { 200: TransacaoSchema } } },
    async (req) => deps.updateTransacao.execute(req.params.id, req.params.transacaoId, req.body),
  )

  app.delete(
    '/faturas/:id/transacoes/:transacaoId',
    { schema: { params: TransacaoParam } },
    async (req, reply) => {
      await deps.deleteTransacao.execute(req.params.id, req.params.transacaoId)
      return reply.status(204).send(null)
    },
  )
}
