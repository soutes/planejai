import type { PrismaClient, Categoria as PrismaCategoria } from '@prisma/client'
import type { ICategoriaRepository } from '../domain/repositories/ICategoriaRepository.js'
import type { Categoria, CreateCategoriaInput, UpdateCategoriaInput } from '../domain/entities/Categoria.js'

export class PrismaCategoriaRepository implements ICategoriaRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findAll(): Promise<Categoria[]> {
    const rows = await this.prisma.categoria.findMany({ orderBy: { nome: 'asc' } })
    return rows.map(this.toDomain)
  }

  async findById(id: number): Promise<Categoria | null> {
    const row = await this.prisma.categoria.findUnique({ where: { id } })
    return row ? this.toDomain(row) : null
  }

  async create(input: CreateCategoriaInput): Promise<Categoria> {
    const row = await this.prisma.categoria.create({
      data: {
        nome: input.nome,
        icon: input.icon ?? '📌',
        padrao: input.padrao ?? false,
        permanente: input.permanente ?? false,
      },
    })
    return this.toDomain(row)
  }

  async update(id: number, input: UpdateCategoriaInput): Promise<Categoria> {
    const row = await this.prisma.categoria.update({ where: { id }, data: input })
    return this.toDomain(row)
  }

  async delete(id: number): Promise<void> {
    await this.prisma.categoria.delete({ where: { id } })
  }

  private toDomain(row: PrismaCategoria): Categoria {
    return {
      id: row.id,
      nome: row.nome,
      icon: row.icon,
      padrao: row.padrao,
      permanente: row.permanente,
      ativa: row.ativa,
    }
  }
}
