import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import type { ListPessoasUseCase } from '../application/use-cases/list-pessoas.use-case.js'
import type { CreatePessoaUseCase } from '../application/use-cases/create-pessoa.use-case.js'
import type { UpdatePessoaUseCase } from '../application/use-cases/update-pessoa.use-case.js'
import type { DeletePessoaUseCase } from '../application/use-cases/delete-pessoa.use-case.js'

const PessoaSchema = z.object({
  id: z.number(),
  nome: z.string(),
  cor: z.string(),
  ativo: z.boolean(),
  familiar: z.boolean(),
  padrao: z.boolean(),
})

const CreateBody = z.object({
  nome: z.string().min(1),
  cor: z.string().optional(),
  familiar: z.boolean().optional(),
})

const UpdateBody = z.object({
  nome: z.string().min(1).optional(),
  cor: z.string().optional(),
  ativo: z.boolean().optional(),
  familiar: z.boolean().optional(),
  padrao: z.boolean().optional(),
})

const IdParam = z.object({ id: z.coerce.number().int().positive() })

export interface PessoasRoutesDeps {
  listPessoas: ListPessoasUseCase
  createPessoa: CreatePessoaUseCase
  updatePessoa: UpdatePessoaUseCase
  deletePessoa: DeletePessoaUseCase
}

export const pessoasRoutes: FastifyPluginAsyncZod<PessoasRoutesDeps> = async (app, deps) => {
  app.get(
    '/pessoas',
    { schema: { response: { 200: z.array(PessoaSchema) } } },
    async () => deps.listPessoas.execute(),
  )

  app.post(
    '/pessoas',
    { schema: { body: CreateBody, response: { 201: PessoaSchema } } },
    async (req, reply) => reply.status(201).send(await deps.createPessoa.execute(req.body)),
  )

  app.put(
    '/pessoas/:id',
    { schema: { params: IdParam, body: UpdateBody, response: { 200: PessoaSchema } } },
    async (req) => deps.updatePessoa.execute(req.params.id, req.body),
  )

  app.delete(
    '/pessoas/:id',
    { schema: { params: IdParam } },
    async (req, reply) => {
      await deps.deletePessoa.execute(req.params.id)
      return reply.status(204).send()
    },
  )
}
