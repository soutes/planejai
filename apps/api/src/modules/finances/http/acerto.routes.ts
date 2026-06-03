import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import type { CalcularAcertoUseCase } from '../application/use-cases/calcular-acerto.use-case.js'
import type { RegistrarAcertoUseCase } from '../application/use-cases/registrar-acerto.use-case.js'
import type { DeleteAcertoUseCase } from '../application/use-cases/delete-acerto.use-case.js'
import type { ListarHistoricoAcertoUseCase } from '../application/use-cases/listar-historico-acerto.use-case.js'

const SaldoDespesaSchema = z.object({
  despesaId: z.number(),
  descricao: z.string(),
  categoria: z.string(),
  valorTotal: z.number(),
  valorProporcional: z.number(),
  valorQuitado: z.number(),
  saldoPendente: z.number(),
  data: z.string().nullable(),
  mesRef: z.string(),
  splitId: z.number(),
})

const SaldoPessoaSchema = z.object({
  pessoaId: z.number(),
  nome: z.string(),
  cor: z.string(),
  saldoMesAtual: z.number(),
  pendenciasAnteriores: z.number(),
  saldoTotal: z.number(),
  direcao: z.enum(['a_receber', 'a_pagar']),
  despesas: z.array(SaldoDespesaSchema),
})

const AcertoEntrySchema = z.object({
  id: z.number(),
  pessoaId: z.number(),
  pessoa: z.object({ id: z.number(), nome: z.string(), cor: z.string() }),
  mesRef: z.string(),
  valor: z.number(),
  data: z.string(),
  formaPagamento: z.string(),
  observacao: z.string().nullable(),
  criadoEm: z.date(),
  splits: z.array(
    z.object({
      id: z.number(),
      splitId: z.number(),
      valorCoberto: z.number(),
      despesa: z.object({
        id: z.number(),
        descricao: z.string(),
        data: z.string().nullable(),
        mesRef: z.string(),
      }),
    }),
  ),
})

const SaldoQuery = z.object({
  mesRef: z.string().regex(/^\d{4}-\d{2}$/),
  // string 'true'/'false' — z.coerce.boolean trataria 'false' como true, então comparamos explícito
  incluirAnteriores: z
    .string()
    .optional()
    .transform((v) => v === 'true'),
  // ids dos membros do grupo, separados por vírgula — restringe saldo a um grupo
  membros: z
    .string()
    .optional()
    .transform((v) => (v ? v.split(',').map(Number).filter((n) => Number.isInteger(n)) : undefined)),
})

const HistoricoQuery = z.object({
  pessoaId: z.coerce.number().int().positive().optional(),
  mesRefInicio: z.string().regex(/^\d{4}-\d{2}$/).optional(),
  mesRefFim: z.string().regex(/^\d{4}-\d{2}$/).optional(),
})

const CreateAcertoBody = z.object({
  pessoaId: z.number().int().positive(),
  mesRef: z.string().regex(/^\d{4}-\d{2}$/),
  valor: z.number().positive(),
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  formaPagamento: z.enum(['pix', 'ted', 'dinheiro', 'outro']),
  observacao: z.string().optional(),
})

const IdParam = z.object({ id: z.coerce.number().int().positive() })

export interface AcertoRoutesDeps {
  calcularAcerto: CalcularAcertoUseCase
  registrarAcerto: RegistrarAcertoUseCase
  deleteAcerto: DeleteAcertoUseCase
  historicoAcerto: ListarHistoricoAcertoUseCase
}

export const acertoRoutes: FastifyPluginAsyncZod<AcertoRoutesDeps> = async (app, deps) => {
  const { calcularAcerto, registrarAcerto, deleteAcerto, historicoAcerto } = deps

  app.get(
    '/acerto',
    { schema: { querystring: SaldoQuery, response: { 200: z.array(SaldoPessoaSchema) } } },
    async (req) => calcularAcerto.execute(req.query.mesRef, req.query.incluirAnteriores, req.query.membros),
  )

  app.get(
    '/acerto/historico',
    { schema: { querystring: HistoricoQuery, response: { 200: z.array(AcertoEntrySchema) } } },
    async (req) =>
      historicoAcerto.execute({
        pessoaId: req.query.pessoaId,
        mesRefInicio: req.query.mesRefInicio,
        mesRefFim: req.query.mesRefFim,
      }),
  )

  app.post(
    '/acerto',
    { schema: { body: CreateAcertoBody, response: { 201: AcertoEntrySchema } } },
    async (req, reply) => {
      const result = await registrarAcerto.execute(req.body)
      return reply.status(201).send(result)
    },
  )

  app.delete(
    '/acerto/:id',
    { schema: { params: IdParam } },
    async (req, reply) => {
      await deleteAcerto.execute(req.params.id)
      return reply.status(204).send()
    },
  )
}
