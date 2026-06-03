import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import type { ListDespesasUseCase } from '../application/use-cases/list-despesas.use-case.js'
import type { CreateDespesaUseCase } from '../application/use-cases/create-despesa.use-case.js'
import type { UpdateDespesaUseCase } from '../application/use-cases/update-despesa.use-case.js'
import type { DeleteDespesaUseCase } from '../application/use-cases/delete-despesa.use-case.js'
import type { GetDespesaSplitsUseCase } from '../application/use-cases/get-despesa-splits.use-case.js'

const DespesaSchema = z.object({
  id: z.number(),
  abaId: z.number(),
  mesRef: z.string(),
  data: z.string().nullable(),
  descricao: z.string(),
  categoria: z.string(),
  valor: z.number(),
  notas: z.string().nullable(),
  tipo: z.enum(['manual', 'fixa', 'parcela', 'cartao', 'cartao_ciclo', 'split_auto']),
  recorrente: z.boolean(),
  totalRepeticoes: z.number().nullable(),
  origemId: z.number().nullable(),
  parcelaNum: z.number().nullable(),
  totalParcelas: z.number().nullable(),
  emFaturaCartao: z.boolean(),
  cartaoId: z.number().nullable(),
  somenteMeu: z.boolean(),
  pagadorId: z.number().nullable(),
  splits: z
    .array(
      z.object({
        id: z.number(),
        despesaId: z.number(),
        pessoaId: z.number(),
        ratio: z.number(),
        valorCalculado: z.number(),
        valorQuitado: z.number(),
      }),
    )
    .optional(),
})

const SplitSchema = z.object({
  id: z.number(),
  despesaId: z.number(),
  pessoaId: z.number(),
  ratio: z.number(),
  valorCalculado: z.number(),
  valorQuitado: z.number(),
})

const CreateDespesaBody = z.object({
  abaId: z.number().int().positive(),
  mesRef: z.string().regex(/^\d{4}-\d{2}$/, 'mesRef deve ser YYYY-MM'),
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  descricao: z.string().min(1),
  categoria: z.string().min(1),
  valor: z.number().positive(),
  notas: z.string().nullable().optional(),
  tipo: z.enum(['manual', 'fixa', 'parcela', 'cartao', 'cartao_ciclo', 'split_auto']).optional(),
  recorrente: z.boolean().optional(),
  totalRepeticoes: z.number().int().positive().nullable().optional(),
  parcelaNum: z.number().int().positive().nullable().optional(),
  totalParcelas: z.number().int().positive().nullable().optional(),
  emFaturaCartao: z.boolean().optional(),
  cartaoId: z.number().int().positive().nullable().optional(),
  somenteMeu: z.boolean().optional(),
  origemId: z.number().int().nullable().optional(),
  pagadorId: z.number().int().positive().nullable().optional(),
  splits: z
    .array(
      z.object({
        pessoaId: z.number().int().positive(),
        ratio: z.number().min(0).max(1),
        valorCalculado: z.number(),
      }),
    )
    .optional(),
})

const UpdateDespesaBody = z.object({
  abaId: z.number().int().positive().optional(),
  mesRef: z.string().regex(/^\d{4}-\d{2}$/, 'mesRef deve ser YYYY-MM').optional(),
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  descricao: z.string().min(1).optional(),
  categoria: z.string().min(1).optional(),
  valor: z.number().positive().optional(),
  notas: z.string().nullable().optional(),
  recorrente: z.boolean().optional(),
  somenteMeu: z.boolean().optional(),
  pagadorId: z.number().int().positive().nullable().optional(),
  splits: z
    .array(
      z.object({
        pessoaId: z.number().int().positive(),
        ratio: z.number().min(0).max(1),
        valorCalculado: z.number(),
      }),
    )
    .optional(),
})

const IdParam = z.object({ id: z.coerce.number().int().positive() })

const ListQuery = z.object({
  abaId: z.coerce.number().int().positive().optional(),
  mesRef: z.string().regex(/^\d{4}-\d{2}$/).optional(),
  cartaoId: z.coerce.number().int().positive().optional(),
})

export interface DespesasRoutesDeps {
  listDespesas: ListDespesasUseCase
  createDespesa: CreateDespesaUseCase
  updateDespesa: UpdateDespesaUseCase
  deleteDespesa: DeleteDespesaUseCase
  getDespesaSplits: GetDespesaSplitsUseCase
}

export const despesasRoutes: FastifyPluginAsyncZod<DespesasRoutesDeps> = async (app, deps) => {
  app.get(
    '/despesas',
    { schema: { querystring: ListQuery, response: { 200: z.array(DespesaSchema) } } },
    async (req) => deps.listDespesas.execute(req.query),
  )

  app.post(
    '/despesas',
    { schema: { body: CreateDespesaBody, response: { 201: DespesaSchema } } },
    async (req, reply) => {
      const { splits, ...despesa } = req.body
      const created = await deps.createDespesa.execute({ despesa, splits })
      return reply.status(201).send(created)
    },
  )

  app.put(
    '/despesas/:id',
    { schema: { params: IdParam, body: UpdateDespesaBody, response: { 200: DespesaSchema } } },
    async (req) => deps.updateDespesa.execute(req.params.id, req.body),
  )

  app.delete(
    '/despesas/:id',
    {
      schema: {
        params: IdParam,
        querystring: z.object({ serie: z.coerce.boolean().optional() }),
      },
    },
    async (req, reply) => {
      await deps.deleteDespesa.execute(req.params.id, req.query.serie)
      return reply.status(204).send()
    },
  )

  app.get(
    '/despesas/:id/splits',
    { schema: { params: IdParam, response: { 200: z.array(SplitSchema) } } },
    async (req) => deps.getDespesaSplits.execute(req.params.id),
  )
}
