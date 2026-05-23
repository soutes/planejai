import type { PrismaClient, Rendimento as PrismaRendimento } from '@prisma/client'
import type { IRendimentoRepository } from '../domain/repositories/IRendimentoRepository.js'
import type { Rendimento, CreateRendimentoInput, UpdateRendimentoInput, ListRendimentosFilter } from '../domain/entities/Rendimento.js'

export class PrismaRendimentoRepository implements IRendimentoRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findMany(filter: ListRendimentosFilter): Promise<Rendimento[]> {
    const rows = await this.prisma.rendimento.findMany({
      where: {
        ...(filter.mesRef && { mesRef: filter.mesRef }),
        ...(filter.pessoaId !== undefined && { pessoaId: filter.pessoaId }),
      },
      orderBy: [{ mesRef: 'desc' }, { id: 'desc' }],
    })
    return rows.map(this.toDomain)
  }

  async findById(id: number): Promise<Rendimento | null> {
    const row = await this.prisma.rendimento.findUnique({ where: { id } })
    return row ? this.toDomain(row) : null
  }

  async create(input: CreateRendimentoInput): Promise<Rendimento> {
    const row = await this.prisma.rendimento.create({
      data: {
        pessoaId: input.pessoaId ?? null,
        mesRef: input.mesRef,
        descricao: input.descricao,
        categoria: input.categoria ?? 'Salário',
        valor: input.valor,
        recorrente: input.recorrente ?? false,
        totalRepeticoes: input.totalRepeticoes ?? null,
        origemId: input.origemId ?? null,
      },
    })
    return this.toDomain(row)
  }

  async update(id: number, input: UpdateRendimentoInput): Promise<Rendimento> {
    const row = await this.prisma.rendimento.update({ where: { id }, data: input })
    return this.toDomain(row)
  }

  async delete(id: number): Promise<void> {
    await this.prisma.rendimento.delete({ where: { id } })
  }

  async deleteMany(origemId: number): Promise<void> {
    await this.prisma.rendimento.deleteMany({
      where: { OR: [{ id: origemId }, { origemId }] },
    })
  }

  private toDomain(row: PrismaRendimento): Rendimento {
    return {
      id: row.id,
      pessoaId: row.pessoaId,
      mesRef: row.mesRef,
      descricao: row.descricao,
      categoria: row.categoria,
      valor: row.valor,
      recorrente: row.recorrente,
      totalRepeticoes: row.totalRepeticoes,
      origemId: row.origemId,
    }
  }
}
