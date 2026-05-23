import type { PrismaClient, RegraFixa as PrismaRegraFixa } from '@prisma/client'
import type { IRegraFixaRepository } from '../domain/repositories/IRegraFixaRepository.js'
import type { RegraFixa, CreateRegraFixaInput, UpdateRegraFixaInput } from '../domain/entities/RegraFixa.js'

export class PrismaRegraFixaRepository implements IRegraFixaRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findAll(): Promise<RegraFixa[]> {
    const rows = await this.prisma.regraFixa.findMany({ orderBy: { descricao: 'asc' } })
    return rows.map(this.toDomain)
  }

  async findById(id: number): Promise<RegraFixa | null> {
    const row = await this.prisma.regraFixa.findUnique({ where: { id } })
    return row ? this.toDomain(row) : null
  }

  async create(input: CreateRegraFixaInput): Promise<RegraFixa> {
    const row = await this.prisma.regraFixa.create({
      data: {
        abaId: input.abaId,
        descricao: input.descricao,
        categoria: input.categoria,
        valor: input.valor,
        diaVencimento: input.diaVencimento ?? null,
      },
    })
    return this.toDomain(row)
  }

  async update(id: number, input: UpdateRegraFixaInput): Promise<RegraFixa> {
    const row = await this.prisma.regraFixa.update({ where: { id }, data: input })
    return this.toDomain(row)
  }

  async delete(id: number): Promise<void> {
    await this.prisma.regraFixa.delete({ where: { id } })
  }

  private toDomain(row: PrismaRegraFixa): RegraFixa {
    return {
      id: row.id,
      abaId: row.abaId,
      descricao: row.descricao,
      categoria: row.categoria,
      valor: row.valor,
      diaVencimento: row.diaVencimento,
      ativo: row.ativo,
    }
  }
}
