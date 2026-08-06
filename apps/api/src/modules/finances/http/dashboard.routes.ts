import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { HttpError } from '../../../shared/errors.js'
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
  despesasPorFormaPagamento: z.array(z.object({
    formaPagamentoId: z.number(),
    nome: z.string(),
    total: z.number(),
  })),
  qtdRendimentos: z.number(),
  serie: z.array(z.object({
    mesRef: z.string(),
    despesas: z.number(),
    rendimentos: z.number(),
    saldo: z.number(),
  })),
  patrimonio: z.object({
    valor: z.number(),
    classes: z.number(),
    serie: z.array(z.object({ mesRef: z.string(), saldo: z.number() })),
  }),
})

// escopo explícito: query string não carrega null de forma confiável.
//   global   = tudo
//   familiar = só o que é compartilhado (aba de grupo)
//   pessoa   = exige pessoaId
const QuerySchema = z.object({
  mesRef: z.string().regex(/^\d{4}-\d{2}$/),
  escopo: z.enum(['global', 'familiar', 'pessoa']).default('global'),
  pessoaId: z.coerce.number().int().positive().optional(),
  meses: z.coerce.number().int().min(1).max(60).default(12),
})

export interface DashboardRoutesDeps {
  getDashboard: GetDashboardUseCase
}

export const dashboardRoutes: FastifyPluginAsyncZod<DashboardRoutesDeps> = async (app, deps) => {
  app.get(
    '/dashboard',
    { schema: { querystring: QuerySchema, response: { 200: DashboardSchema } } },
    async (req) => {
      const { mesRef, escopo, pessoaId, meses } = req.query
      if (escopo === 'pessoa' && pessoaId === undefined) {
        throw HttpError.badRequest('escopo=pessoa exige pessoaId')
      }
      const escopoPessoa = escopo === 'pessoa' ? pessoaId : escopo === 'familiar' ? null : undefined
      return deps.getDashboard.execute({ mesRef, escopo: escopoPessoa, meses })
    },
  )
}
