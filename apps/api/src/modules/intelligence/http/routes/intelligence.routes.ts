import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import type { AnalyzePdfUseCase } from '../../domain/use-cases/AnalyzePdfUseCase.js'
import type { GenerateReportUseCase } from '../../domain/use-cases/GenerateReportUseCase.js'

const TransacaoSchema = z.object({
  data: z.string().nullable(),
  descricao: z.string().nullable(),
  estabelecimento: z.string().nullable(),
  valor: z.number().nullable(),
  categoria: z.string().nullable(),
  parcela: z.string().nullable(),
})

const ResumoCategoriaSchema = z.object({
  categoria: z.string(),
  valor: z.number(),
  percentual: z.number(),
  qtd_transacoes: z.number(),
})

const FaturaAnalisadaSchema = z.object({
  faturaId: z.number(),
  fatura: z.object({
    banco: z.string().nullable(),
    mes_referencia: z.string().nullable(),
    vencimento: z.string().nullable(),
    total: z.number().nullable(),
    limite: z.number().nullable(),
  }),
  transacoes: z.array(TransacaoSchema),
  resumo_categorias: z.array(ResumoCategoriaSchema),
  comentario_executivo: z.string().nullable(),
})

const RelatorioSchema = z.object({
  titulo: z.string(),
  resumo: z.string(),
  destaques: z.array(z.object({
    tipo: z.string(),
    titulo: z.string(),
    descricao: z.string(),
  })),
  alertas: z.array(z.string()),
  recomendacoes: z.array(z.string()),
  comentario_final: z.string(),
})

const AnalyzePdfBody = z.object({
  pdfBase64: z.string().min(1),
  cartaoId: z.number().int().positive(),
  arquivoOriginal: z.string().optional(),
  mesRefOverride: z.string().regex(/^\d{4}-\d{2}$/).optional(),
  mediaType: z.string().optional(),
})

const ReportBody = z.object({
  mesRef: z.string().regex(/^\d{4}-\d{2}$/, 'mesRef deve ser YYYY-MM'),
})

export interface IntelligenceRoutesDeps {
  analyzePdf: AnalyzePdfUseCase
  generateReport: GenerateReportUseCase
}

export const intelligenceRoutes: FastifyPluginAsyncZod<IntelligenceRoutesDeps> = async (app, deps) => {
  app.post(
    '/intelligence/analyze-pdf',
    { schema: { body: AnalyzePdfBody, response: { 200: FaturaAnalisadaSchema } } },
    async (req) => deps.analyzePdf.execute(req.body),
  )

  app.post(
    '/intelligence/report',
    { schema: { body: ReportBody, response: { 200: RelatorioSchema } } },
    async (req) => deps.generateReport.execute(req.body),
  )
}
