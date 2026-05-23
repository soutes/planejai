import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import type { PrismaAIConfigRepository } from '../../infra/prisma-aiconfig.repository.js'
import type { DynamicLLMRepository } from '../../infra/dynamic-llm.repository.js'

const AIProvider = z.enum(['anthropic', 'openai', 'openrouter', 'gemini'])

const AIConfigSchema = z.object({
  provider: AIProvider,
  model: z.string(),
  baseUrl: z.string(),
  keyConfigured: z.boolean(),
  keyPreview: z.string(),
})

const SaveBody = z.object({
  provider: AIProvider,
  apiKey: z.string().optional(),
  model: z.string().min(1),
  baseUrl: z.string().optional(),
})

const TestBody = z.object({
  provider: AIProvider.optional(),
  apiKey: z.string().optional(),
  model: z.string().optional(),
  baseUrl: z.string().optional(),
})

const ProbeSchema = z.object({
  ok: z.boolean(),
  latencyMs: z.number(),
  sample: z.string().optional(),
  error: z.string().optional(),
})

const TestResultSchema = z.object({
  ok: z.boolean(),
  provider: z.string(),
  model: z.string(),
  baseUrl: z.string(),
  text: ProbeSchema,
  image: ProbeSchema,
  pdf: ProbeSchema,
})

export interface AIConfigRoutesDeps {
  aiConfigRepo: PrismaAIConfigRepository
  llmRepo: DynamicLLMRepository
}

export const aiConfigRoutes: FastifyPluginAsyncZod<AIConfigRoutesDeps> = async (app, deps) => {
  const { aiConfigRepo, llmRepo } = deps

  app.get(
    '/config/ia',
    { schema: { response: { 200: AIConfigSchema } } },
    async () => aiConfigRepo.get(),
  )

  app.put(
    '/config/ia',
    { schema: { body: SaveBody, response: { 200: AIConfigSchema } } },
    async (req) => aiConfigRepo.save(req.body),
  )

  // Testa config IA (texto + imagem + PDF); overrides do body sobrescrevem config salva
  app.post(
    '/config/ia/test',
    { schema: { body: TestBody, response: { 200: TestResultSchema } } },
    async (req) => {
      const saved = await aiConfigRepo.getRawConfig()
      const cfg = {
        provider: req.body.provider ?? saved.provider,
        model: req.body.model || saved.model,
        baseUrl: req.body.baseUrl ?? saved.baseUrl,
        apiKey: req.body.apiKey || saved.apiKey,
      }
      const empty = { ok: false, latencyMs: 0, error: 'API key não configurada' }
      if (!cfg.apiKey) {
        return {
          ok: false,
          provider: cfg.provider, model: cfg.model, baseUrl: cfg.baseUrl,
          text: empty, image: empty, pdf: empty,
        }
      }

      // PNG 1x1 transparente
      const tinyPng = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='
      // PDF mínimo válido (1 página vazia)
      const tinyPdf = 'JVBERi0xLjEKJcKlsdvrCgoxIDAgb2JqCjw8IC9UeXBlIC9DYXRhbG9nIC9QYWdlcyAyIDAgUiA+PgplbmRvYmoKMiAwIG9iago8PCAvVHlwZSAvUGFnZXMgL0tpZHMgWzMgMCBSXSAvQ291bnQgMSAvTWVkaWFCb3ggWzAgMCAxMDAgMTAwXSA+PgplbmRvYmoKMyAwIG9iago8PCAvVHlwZSAvUGFnZSAvUGFyZW50IDIgMCBSID4+CmVuZG9iagp4cmVmCjAgNAowMDAwMDAwMDAwIDY1NTM1IGYKMDAwMDAwMDAxNSAwMDAwMCBuCjAwMDAwMDAwNjQgMDAwMDAgbgowMDAwMDAwMTQwIDAwMDAwIG4KdHJhaWxlcgo8PCAvUm9vdCAxIDAgUiAvU2l6ZSA0ID4+CnN0YXJ0eHJlZgoxODAKJSVFT0Y='

      async function probe(messages: Parameters<typeof llmRepo.callWithConfig>[1]['messages']) {
        const startedAt = Date.now()
        try {
          const out = await llmRepo.callWithConfig(cfg, {
            systemPrompt: 'Responda em no máximo 5 palavras.',
            messages,
          })
          return { ok: true, latencyMs: Date.now() - startedAt, sample: out.slice(0, 200) }
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'erro desconhecido'
          return { ok: false, latencyMs: Date.now() - startedAt, error: msg.slice(0, 400) }
        }
      }

      const [text, image, pdf] = await Promise.all([
        probe([{ role: 'user', content: 'ping' }]),
        probe([{
          role: 'user',
          content: [
            { type: 'text', text: 'O que você vê?' },
            { type: 'image', source: { type: 'base64', media_type: 'image/png', data: tinyPng } },
          ],
        }]),
        probe([{
          role: 'user',
          content: [
            { type: 'text', text: 'O que tem neste PDF?' },
            { type: 'image', source: { type: 'base64', media_type: 'application/pdf', data: tinyPdf } },
          ],
        }]),
      ])

      return {
        ok: text.ok,
        provider: cfg.provider, model: cfg.model, baseUrl: cfg.baseUrl,
        text, image, pdf,
      }
    },
  )
}
