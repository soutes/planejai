import type { PrismaClient, Orcamento as PrismaOrcamento } from '@prisma/client'
import type { IOrcamentoRepository } from '../domain/repositories/IOrcamentoRepository.js'
import type { Orcamento, UpsertOrcamentoInput, ListOrcamentosFilter } from '../domain/entities/Orcamento.js'

export class PrismaOrcamentoRepository implements IOrcamentoRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findMany(filter: ListOrcamentosFilter): Promise<Orcamento[]> {
    const rows = await this.prisma.orcamento.findMany({
      where: {
        ...(filter.abaId !== undefined && { abaId: filter.abaId }),
        ...(filter.mesRef !== undefined && { mesRef: filter.mesRef }),
      },
      orderBy: { categoria: 'asc' },
    })
    return rows.map(this.toDomain)
  }

  async upsert(input: UpsertOrcamentoInput): Promise<Orcamento> {
    const mesRef = input.mesRef ?? null

    // Meta de um mês específico: o índice UNIQUE casa normalmente.
    if (mesRef !== null) {
      const row = await this.prisma.orcamento.upsert({
        where: {
          abaId_mesRef_categoria: { abaId: input.abaId, mesRef, categoria: input.categoria },
        },
        create: { abaId: input.abaId, mesRef, categoria: input.categoria, valorMeta: input.valorMeta },
        update: { valorMeta: input.valorMeta },
      })
      return this.toDomain(row)
    }

    // Meta padrão (mesRef NULL): em SQLite NULL != NULL dentro de índice UNIQUE, então
    // o upsert nunca encontra a linha existente e insere uma nova a cada gravação.
    // Resolve na mão: acha a primeira, atualiza, e varre duplicatas deixadas para trás.
    const existentes = await this.prisma.orcamento.findMany({
      where: { abaId: input.abaId, mesRef: null, categoria: input.categoria },
      orderBy: { id: 'asc' },
    })
    const [primeira, ...duplicadas] = existentes

    if (duplicadas.length > 0) {
      await this.prisma.orcamento.deleteMany({ where: { id: { in: duplicadas.map((d) => d.id) } } })
    }

    const row = primeira
      ? await this.prisma.orcamento.update({
          where: { id: primeira.id },
          data: { valorMeta: input.valorMeta },
        })
      : await this.prisma.orcamento.create({
          data: { abaId: input.abaId, mesRef: null, categoria: input.categoria, valorMeta: input.valorMeta },
        })
    return this.toDomain(row)
  }

  async delete(id: number): Promise<void> {
    await this.prisma.orcamento.delete({ where: { id } })
  }

  private toDomain(row: PrismaOrcamento): Orcamento {
    return { id: row.id, abaId: row.abaId, mesRef: row.mesRef, categoria: row.categoria, valorMeta: row.valorMeta }
  }
}
