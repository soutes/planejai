import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import type { ListDivisoesUseCase } from '../application/use-cases/list-divisoes.use-case.js'
import type { CreateDivisaoUseCase } from '../application/use-cases/create-divisao.use-case.js'
import type { QuitarDivisaoUseCase } from '../application/use-cases/quitar-divisao.use-case.js'

const DivisaoSchema = z.object({
  id: z.number(),
  pessoaId: z.number(),
  mesRef: z.string(),
  descricao: z.string(),
  valorTotal: z.number(),
  direcao: z.enum(['a_receber', 'a_pagar']),
  parcelado: z.boolean(),
  totalParcelas: z.number().nullable(),
  parcelaAtual: z.number().nullable(),
  dataInicio: z.string().nullable(),
  origemDespesaId: z.number().nullable(),
  quitado: z.boolean(),
  notas: z.string().nullable(),
})

const IdParam = z.object({ id: z.coerce.number().int().positive() })
const ListQuery = z.object({
  pessoaId: z.coerce.number().int().positive().optional(),
  quitado: z.coerce.boolean().optional(),
})
const CreateBody = z.object({
  pessoaId: z.number().int().positive(),
  mesRef: z.string().regex(/^\d{4}-\d{2}$/),
  descricao: z.string().min(1),
  valorTotal: z.number().positive(),
  direcao: z.enum(['a_receber', 'a_pagar']).optional(),
  parcelado: z.boolean().optional(),
  totalParcelas: z.number().int().positive().nullable().optional(),
  parcelaAtual: z.number().int().positive().nullable().optional(),
  dataInicio: z.string().nullable().optional(),
  origemDespesaId: z.number().int().positive().nullable().optional(),
  notas: z.string().nullable().optional(),
})

export interface SplitsRoutesDeps {
  listDivisoes: ListDivisoesUseCase
  createDivisao: CreateDivisaoUseCase
  quitarDivisao: QuitarDivisaoUseCase
}

export const splitsRoutes: FastifyPluginAsyncZod<SplitsRoutesDeps> = async (app, deps) => {
  const { listDivisoes, createDivisao, quitarDivisao } = deps

  app.get(
    '/divisao',
    { schema: { querystring: ListQuery, response: { 200: z.array(DivisaoSchema) } } },
    async (req) => listDivisoes.execute(req.query),
  )

  app.post(
    '/divisao',
    { schema: { body: CreateBody, response: { 201: DivisaoSchema } } },
    async (req, reply) => {
      const entry = await createDivisao.execute(req.body)
      return reply.status(201).send(entry)
    },
  )

  app.put(
    '/divisao/:id',
    { schema: { params: IdParam, response: { 200: DivisaoSchema } } },
    async (req) => quitarDivisao.execute(req.params.id),
  )
}
