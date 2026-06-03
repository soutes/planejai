import type { FastifyInstance } from 'fastify'
import type { PrismaClient } from '@prisma/client'

import { DynamicLLMRepository } from './infra/dynamic-llm.repository.js'
import { PrismaAIConfigRepository } from './infra/prisma-aiconfig.repository.js'
import { AwesomeFxRateRepository } from './infra/awesome-fx-rate.repository.js'
import { AnalyzePdfUseCase } from './domain/use-cases/AnalyzePdfUseCase.js'
import { GenerateReportUseCase } from './domain/use-cases/GenerateReportUseCase.js'

import { PrismaFaturaRepository } from '../finances/infra/prisma-fatura.repository.js'
import { PrismaDespesaRepository } from '../finances/infra/prisma-despesa.repository.js'
import { PrismaRendimentoRepository } from '../finances/infra/prisma-rendimento.repository.js'
import { PrismaInvestimentoRepository } from '../finances/infra/prisma-investimento.repository.js'
import { PrismaCartaoRepository } from '../finances/infra/prisma-cartao.repository.js'
import { PrismaAbaRepository } from '../finances/infra/prisma-aba.repository.js'
import { PrismaPessoaRepository } from '../finances/infra/prisma-pessoa.repository.js'
import { PrismaCategoriaRepository } from '../finances/infra/prisma-categoria.repository.js'
import { PrismaCategoryRuleRepository } from '../finances/infra/prisma-category-rule.repository.js'

import { intelligenceRoutes } from './http/routes/intelligence.routes.js'
import { aiConfigRoutes } from './http/routes/aiconfig.routes.js'

export async function buildIntelligenceModule(app: FastifyInstance, prisma: PrismaClient) {
  const aiConfigRepo = new PrismaAIConfigRepository(prisma)
  const llmRepo = new DynamicLLMRepository(aiConfigRepo)

  const faturaRepo = new PrismaFaturaRepository(prisma)
  const despesaRepo = new PrismaDespesaRepository(prisma)
  const rendimentoRepo = new PrismaRendimentoRepository(prisma)
  const investimentoRepo = new PrismaInvestimentoRepository(prisma)
  const cartaoRepo = new PrismaCartaoRepository(prisma)
  const abaRepo = new PrismaAbaRepository(prisma)
  const pessoaRepo = new PrismaPessoaRepository(prisma)
  const categoriaRepo = new PrismaCategoriaRepository(prisma)
  const categoryRuleRepo = new PrismaCategoryRuleRepository(prisma)
  const fxRateRepo = new AwesomeFxRateRepository()

  await app.register(
    async (api) => {
      await api.register(intelligenceRoutes, {
        analyzePdf: new AnalyzePdfUseCase(llmRepo, faturaRepo, cartaoRepo, abaRepo, pessoaRepo, despesaRepo, categoriaRepo, categoryRuleRepo, fxRateRepo),
        generateReport: new GenerateReportUseCase(
          llmRepo, despesaRepo, rendimentoRepo, investimentoRepo, abaRepo, pessoaRepo, cartaoRepo, faturaRepo,
        ),
      })
      await api.register(aiConfigRoutes, { aiConfigRepo, llmRepo })
    },
    { prefix: '/api' },
  )
}
