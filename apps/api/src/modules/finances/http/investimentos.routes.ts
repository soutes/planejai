import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import type { ListPosicoesUseCase } from '../application/use-cases/list-posicoes.use-case.js'
import type { CreatePosicaoUseCase } from '../application/use-cases/create-posicao.use-case.js'
import type { UpdatePosicaoUseCase } from '../application/use-cases/update-posicao.use-case.js'
import type { DeactivatePosicaoUseCase } from '../application/use-cases/deactivate-posicao.use-case.js'
import type { ListMovimentacoesUseCase } from '../application/use-cases/list-movimentacoes.use-case.js'
import type { CreateMovimentacaoUseCase } from '../application/use-cases/create-movimentacao.use-case.js'
import type { UpdateMovimentacaoUseCase } from '../application/use-cases/update-movimentacao.use-case.js'
import type { DeleteMovimentacaoUseCase } from '../application/use-cases/delete-movimentacao.use-case.js'
import type { GetEvolucaoUseCase } from '../application/use-cases/get-evolucao.use-case.js'

// ─── Schemas Zod ─────────────────────────────────────────────────────────────

const PosicaoSchema = z.object({
  id: z.number(),
  pessoaId: z.number().nullable(),
  categoria: z.string(),
  instituicao: z.string(),
  ativo: z.boolean(),
  notas: z.string().nullable(),
  saldo_atual: z.number(),
  total_investido: z.number(),
  total_rendimentos: z.number(),
  rentabilidade_pct: z.number(),
})

const MovimentacaoSchema = z.object({
  id: z.number(),
  investimentoId: z.number(),
  mesRef: z.string(),
  tipo: z.enum(['APORTE', 'RENDIMENTO', 'RESGATE']),
  valor: z.number(),
  notas: z.string().nullable(),
  posicao: z.object({
    categoria: z.string(),
    instituicao: z.string(),
  }),
})

const EvolucaoSchema = z.object({
  mesRef: z.string(),
  saldo: z.number(),
  aportes: z.number(),
  rendimentos: z.number(),
  resgates: z.number(),
})

const IdParam = z.object({ id: z.coerce.number().int().positive() })

const ListPosicoesQuery = z.object({
  pessoaId: z.coerce.number().int().nullable().optional(),
  ativo: z.coerce.boolean().optional(),
})

const CreatePosicaoBody = z.object({
  pessoaId: z.number().int().positive().nullable().optional(),
  categoria: z.string().min(1),
  instituicao: z.string().min(1),
  notas: z.string().nullable().optional(),
})

const UpdatePosicaoBody = z.object({
  categoria: z.string().min(1).optional(),
  instituicao: z.string().min(1).optional(),
  ativo: z.boolean().optional(),
  notas: z.string().nullable().optional(),
})

const ListMovimentacoesQuery = z.object({
  investimentoId: z.coerce.number().int().positive().optional(),
  mesRef: z.string().regex(/^\d{4}-\d{2}$/).optional(),
  tipo: z.enum(['APORTE', 'RENDIMENTO', 'RESGATE']).optional(),
  pessoaId: z.coerce.number().int().nullable().optional(),
})

const CreateMovimentacaoBody = z.object({
  investimentoId: z.number().int().positive(),
  mesRef: z.string().regex(/^\d{4}-\d{2}$/),
  tipo: z.enum(['APORTE', 'RENDIMENTO', 'RESGATE']),
  valor: z.number().positive(),
  notas: z.string().nullable().optional(),
})

const UpdateMovimentacaoBody = z.object({
  mesRef: z.string().regex(/^\d{4}-\d{2}$/).optional(),
  tipo: z.enum(['APORTE', 'RENDIMENTO', 'RESGATE']).optional(),
  valor: z.number().positive().optional(),
  notas: z.string().nullable().optional(),
})

const EvolucaoQuery = z.object({
  meses: z.coerce.number().int().min(1).max(60).default(12),
  pessoaId: z.coerce.number().int().nullable().optional(),
})

// ─── Deps ────────────────────────────────────────────────────────────────────

export interface InvestimentosRoutesDeps {
  listPosicoes: ListPosicoesUseCase
  createPosicao: CreatePosicaoUseCase
  updatePosicao: UpdatePosicaoUseCase
  deactivatePosicao: DeactivatePosicaoUseCase
  listMovimentacoes: ListMovimentacoesUseCase
  createMovimentacao: CreateMovimentacaoUseCase
  updateMovimentacao: UpdateMovimentacaoUseCase
  deleteMovimentacao: DeleteMovimentacaoUseCase
  getEvolucao: GetEvolucaoUseCase
}

// ─── Plugin ──────────────────────────────────────────────────────────────────

export const investimentosRoutes: FastifyPluginAsyncZod<InvestimentosRoutesDeps> = async (
  app,
  deps,
) => {
  // ── Posições ──────────────────────────────────────────────────────────────

  app.get(
    '/investimentos/posicoes',
    {
      schema: {
        querystring: ListPosicoesQuery,
        response: { 200: z.array(PosicaoSchema) },
      },
    },
    async (req) =>
      deps.listPosicoes.execute({
        pessoaId: req.query.pessoaId,
        ativo: req.query.ativo,
      }),
  )

  app.post(
    '/investimentos/posicoes',
    {
      schema: {
        body: CreatePosicaoBody,
        response: { 201: PosicaoSchema.omit({ saldo_atual: true, total_investido: true, total_rendimentos: true, rentabilidade_pct: true }).extend({
          saldo_atual: z.number(),
          total_investido: z.number(),
          total_rendimentos: z.number(),
          rentabilidade_pct: z.number(),
        }) },
      },
    },
    async (req, reply) => {
      const posicao = await deps.createPosicao.execute(req.body)
      // Retornar com métricas zeradas (recém criada)
      return reply.status(201).send({
        ...posicao,
        saldo_atual: 0,
        total_investido: 0,
        total_rendimentos: 0,
        rentabilidade_pct: 0,
      })
    },
  )

  app.put(
    '/investimentos/posicoes/:id',
    {
      schema: {
        params: IdParam,
        body: UpdatePosicaoBody,
        response: { 200: PosicaoSchema },
      },
    },
    async (req) => {
      const posicao = await deps.updatePosicao.execute(req.params.id, req.body)
      // Buscar métricas atuais através do listPosicoes com filtro
      const posicoes = await deps.listPosicoes.execute({})
      const posicaoComMetricas = posicoes.find((p) => p.id === posicao.id)
      if (posicaoComMetricas) return posicaoComMetricas
      return { ...posicao, saldo_atual: 0, total_investido: 0, total_rendimentos: 0, rentabilidade_pct: 0 }
    },
  )

  app.delete(
    '/investimentos/posicoes/:id',
    {
      schema: {
        params: IdParam,
        response: { 204: z.null() },
      },
    },
    async (req, reply) => {
      await deps.deactivatePosicao.execute(req.params.id)
      return reply.status(204).send(null)
    },
  )

  // ── Movimentações ─────────────────────────────────────────────────────────

  app.get(
    '/investimentos/movimentacoes',
    {
      schema: {
        querystring: ListMovimentacoesQuery,
        response: { 200: z.array(MovimentacaoSchema) },
      },
    },
    async (req) => deps.listMovimentacoes.execute(req.query),
  )

  app.post(
    '/investimentos/movimentacoes',
    {
      schema: {
        body: CreateMovimentacaoBody,
        response: { 201: MovimentacaoSchema },
      },
    },
    async (req, reply) => {
      const mov = await deps.createMovimentacao.execute(req.body)
      // Buscar posição para popular o campo posicao
      const movs = await deps.listMovimentacoes.execute({ investimentoId: mov.investimentoId })
      const movComPosicao = movs.find((m) => m.id === mov.id)
      if (movComPosicao) return reply.status(201).send(movComPosicao)
      return reply.status(201).send({ ...mov, posicao: { categoria: '', instituicao: '' } })
    },
  )

  app.put(
    '/investimentos/movimentacoes/:id',
    {
      schema: {
        params: IdParam,
        // body validado manualmente — bypass schema registration issue
      },
    },
    async (req) => {
      const raw = req.body as Record<string, unknown>
      const input = UpdateMovimentacaoBody.parse(raw)
      const mov = await deps.updateMovimentacao.execute(req.params.id, input)
      const movs = await deps.listMovimentacoes.execute({ investimentoId: mov.investimentoId })
      const movComPosicao = movs.find((m) => m.id === mov.id)
      if (movComPosicao) return movComPosicao
      return { ...mov, posicao: { categoria: '', instituicao: '' } }
    },
  )

  app.delete(
    '/investimentos/movimentacoes/:id',
    {
      schema: {
        params: IdParam,
        response: { 204: z.null() },
      },
    },
    async (req, reply) => {
      await deps.deleteMovimentacao.execute(req.params.id)
      return reply.status(204).send(null)
    },
  )

  // ── Evolução patrimonial ──────────────────────────────────────────────────

  app.get(
    '/investimentos/evolucao',
    {
      schema: {
        querystring: EvolucaoQuery,
        response: { 200: z.array(EvolucaoSchema) },
      },
    },
    async (req) => deps.getEvolucao.execute(req.query.meses, req.query.pessoaId),
  )
}
