import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import type { GetDashboardUseCase } from '../application/use-cases/get-dashboard.use-case.js'

const DashboardSchema = z.object({
  mesRef: z.string(),
  totalDespesas: z.number(),
  totalRendimentos: z.number(),
  totalInvestido: z.number(),
  saldo: z.number(),
  despesasPorAba: z.array(z.object({
    abaId: z.number(),
    abaNome: z.string(),
    abaCor: z.string(),
    total: z.number(),
  })),
  despesasPorCategoria: z.array(z.object({
    categoria: z.string(),
    total: z.number(),
    percentual: z.number(),
  })),
  orcamentos: z.array(z.object({
    abaId: z.number(),
    categoria: z.string(),
    valorMeta: z.number(),
    gasto: z.number(),
  })),
  divisoesPendentes: z.array(z.object({
    id: z.number(),
    pessoaId: z.number(),
    pessoaNome: z.string(),
    valorTotal: z.number(),
    direcao: z.string(),
    descricao: z.string(),
  })),
})

const QuerySchema = z.object({
  mesRef: z.string().regex(/^\d{4}-\d{2}$/),
})

export interface DashboardRoutesDeps {
  getDashboard: GetDashboardUseCase
}

export const dashboardRoutes: FastifyPluginAsyncZod<DashboardRoutesDeps> = async (app, deps) => {
  app.get(
    '/dashboard',
    { schema: { querystring: QuerySchema, response: { 200: DashboardSchema } } },
    async (req) => deps.getDashboard.execute(req.query.mesRef),
  )
}
