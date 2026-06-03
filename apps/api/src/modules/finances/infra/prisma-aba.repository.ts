import type { PrismaClient, AbaDespesa as PrismaAba } from '@prisma/client'
import type { IAbaRepository } from '../domain/repositories/IAbaRepository.js'
import type { AbaDespesa, CreateAbaInput, UpdateAbaInput } from '../domain/entities/AbaDespesa.js'

export class PrismaAbaRepository implements IAbaRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findAll(): Promise<AbaDespesa[]> {
    const rows = await this.prisma.abaDespesa.findMany({
      orderBy: { ordem: 'asc' },
      include: { pessoas: { select: { pessoaId: true } } },
    })
    return rows.map(this.toDomain)
  }

  async findById(id: number): Promise<AbaDespesa | null> {
    const row = await this.prisma.abaDespesa.findUnique({
      where: { id },
      include: { pessoas: { select: { pessoaId: true } } },
    })
    return row ? this.toDomain(row) : null
  }

  async create(input: CreateAbaInput): Promise<AbaDespesa> {
    const row = await this.prisma.abaDespesa.create({
      data: {
        nome: input.nome,
        icon: input.icon ?? '💸',
        cor: input.cor ?? '#10F5A3',
        ordem: input.ordem ?? 0,
        splitDestinoCategoria: input.splitDestinoCategoria ?? null,
      },
    })
    return this.toDomain(row)
  }

  async update(id: number, input: UpdateAbaInput): Promise<AbaDespesa> {
    const row = await this.prisma.abaDespesa.update({ where: { id }, data: input })
    return this.toDomain(row)
  }

  async delete(id: number): Promise<void> {
    await this.prisma.abaDespesa.delete({ where: { id } })
  }

  private toDomain(row: PrismaAba & { pessoas?: { pessoaId: number }[] }): AbaDespesa {
    return {
      id: row.id,
      nome: row.nome,
      icon: row.icon,
      cor: row.cor,
      ordem: row.ordem,
      splitDestinoCategoria: row.splitDestinoCategoria,
      ativo: row.ativo,
      pessoaId: row.pessoaId,
      membros: row.pessoas?.map((p) => p.pessoaId) ?? [],
    }
  }
}
