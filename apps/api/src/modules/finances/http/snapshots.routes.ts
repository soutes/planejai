import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import type { ListSnapshotsUseCase } from '../application/use-cases/list-snapshots.use-case.js'
import type { CreateSnapshotUseCase } from '../application/use-cases/create-snapshot.use-case.js'
import type { DeleteSnapshotUseCase } from '../application/use-cases/delete-snapshot.use-case.js'

const SnapshotSchema = z.object({
  id: z.number(),
  cartaoId: z.number(),
  cicloInicio: z.string(),
  cicloFim: z.string(),
  dataUpload: z.string(),
  total: z.number(),
  qtdTransacoes: z.number(),
  jsonDados: z.string(),
})

const CreateBody = z.object({
  cartaoId: z.number().int().positive(),
  cicloInicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'cicloInicio deve ser YYYY-MM-DD'),
  cicloFim: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'cicloFim deve ser YYYY-MM-DD'),
  dataUpload: z.string(),
  total: z.number().min(0),
  qtdTransacoes: z.number().int().min(0),
  jsonDados: z.string(),
})

const IdParam = z.object({ id: z.coerce.number().int().positive() })
const ListQuery = z.object({ cartaoId: z.coerce.number().int().positive().optional() })

export interface SnapshotsRoutesDeps {
  listSnapshots: ListSnapshotsUseCase
  createSnapshot: CreateSnapshotUseCase
  deleteSnapshot: DeleteSnapshotUseCase
}

export const snapshotsRoutes: FastifyPluginAsyncZod<SnapshotsRoutesDeps> = async (app, deps) => {
  app.get(
    '/snapshots',
    { schema: { querystring: ListQuery, response: { 200: z.array(SnapshotSchema) } } },
    async (req) => deps.listSnapshots.execute(req.query),
  )

  app.post(
    '/snapshots',
    { schema: { body: CreateBody, response: { 201: SnapshotSchema } } },
    async (req, reply) => reply.status(201).send(await deps.createSnapshot.execute(req.body)),
  )

  app.delete(
    '/snapshots/:id',
    { schema: { params: IdParam, response: { 204: z.null() } } },
    async (req, reply) => {
      await deps.deleteSnapshot.execute(req.params.id)
      return reply.status(204).send(null)
    },
  )
}
