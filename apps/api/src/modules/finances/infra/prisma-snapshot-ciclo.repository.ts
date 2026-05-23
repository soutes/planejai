import type { PrismaClient, SnapshotCiclo as PrismaSnapshot } from '@prisma/client'
import type { ISnapshotCicloRepository } from '../domain/repositories/ISnapshotCicloRepository.js'
import type { SnapshotCiclo, CreateSnapshotInput, ListSnapshotsFilter } from '../domain/entities/SnapshotCiclo.js'

export class PrismaSnapshotCicloRepository implements ISnapshotCicloRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findMany(filter: ListSnapshotsFilter): Promise<SnapshotCiclo[]> {
    const rows = await this.prisma.snapshotCiclo.findMany({
      where: { ...(filter.cartaoId !== undefined && { cartaoId: filter.cartaoId }) },
      orderBy: { cicloInicio: 'desc' },
    })
    return rows.map(this.toDomain)
  }

  async findById(id: number): Promise<SnapshotCiclo | null> {
    const row = await this.prisma.snapshotCiclo.findUnique({ where: { id } })
    return row ? this.toDomain(row) : null
  }

  async create(input: CreateSnapshotInput): Promise<SnapshotCiclo> {
    const row = await this.prisma.snapshotCiclo.create({ data: input })
    return this.toDomain(row)
  }

  async delete(id: number): Promise<void> {
    await this.prisma.snapshotCiclo.delete({ where: { id } })
  }

  private toDomain(row: PrismaSnapshot): SnapshotCiclo {
    return {
      id: row.id,
      cartaoId: row.cartaoId,
      cicloInicio: row.cicloInicio,
      cicloFim: row.cicloFim,
      dataUpload: row.dataUpload,
      total: row.total,
      qtdTransacoes: row.qtdTransacoes,
      jsonDados: row.jsonDados,
    }
  }
}
