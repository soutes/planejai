import Fastify from 'fastify'
import cors from '@fastify/cors'
import {
  serializerCompiler,
  validatorCompiler,
  ZodTypeProvider,
} from 'fastify-type-provider-zod'

import { HttpError } from './shared/errors.js'
import { prisma } from './shared/prisma.js'
import { buildFinancesModule } from './modules/finances/finances.module.js'
import { buildIntelligenceModule } from './modules/intelligence/intelligence.module.js'

export async function buildApp() {
  const app = Fastify({
    logger: true,
    bodyLimit: 50 * 1024 * 1024, // 50MB — faturas PDF renderizadas em PNG base64
  }).withTypeProvider<ZodTypeProvider>()

  app.setValidatorCompiler(validatorCompiler)
  app.setSerializerCompiler(serializerCompiler)

  await app.register(cors, {
    origin: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
  })

  app.setErrorHandler((error: Error, _req, reply) => {
    if (error instanceof HttpError) {
      return reply.status(error.statusCode).send({ error: error.message })
    }
    const fe = error as Error & { validation?: unknown; statusCode?: number }
    if (fe.validation) {
      return reply.status(400).send({ error: 'Validation error', details: fe.message })
    }
    if (fe.statusCode === 400) {
      return reply.status(400).send({ error: fe.message })
    }
    // Erro não previsto: log completo do lado do servidor, mensagem genérica na
    // resposta. `error.message` do Prisma carrega caminho de arquivo, nome de coluna
    // e trecho de SQL — nada disso precisa chegar ao cliente.
    app.log.error(error)
    return reply.status(500).send({ error: 'Erro interno. Veja o log do aplicativo para detalhes.' })
  })

  app.get('/health', async () => ({ status: 'ok', ts: new Date().toISOString() }))

  // Finances: prefix /api aplicado internamente em finances.module.ts
  await buildFinancesModule(app, prisma)

  // Intelligence: prefix /api aplicado internamente em intelligence.module.ts
  await buildIntelligenceModule(app, prisma)

  return app
}
