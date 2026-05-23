import type { PrismaClient, Pessoa as PrismaPessoa } from '@prisma/client'
import type { IPessoaRepository } from '../domain/repositories/IPessoaRepository.js'
import type { Pessoa, CreatePessoaInput, UpdatePessoaInput } from '../domain/entities/Pessoa.js'

export class PrismaPessoaRepository implements IPessoaRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findAll(): Promise<Pessoa[]> {
    const rows = await this.prisma.pessoa.findMany({ orderBy: { nome: 'asc' } })
    return rows.map(this.toDomain)
  }

  async findById(id: number): Promise<Pessoa | null> {
    const row = await this.prisma.pessoa.findUnique({ where: { id } })
    return row ? this.toDomain(row) : null
  }

  async create(input: CreatePessoaInput): Promise<Pessoa> {
    const cor = input.cor ?? '#B07AFF'
    const row = await this.prisma.pessoa.create({
      data: { nome: input.nome, cor, familiar: input.familiar ?? false },
    })
    // Auto-cria aba própria da pessoa
    await this.prisma.abaDespesa.create({
      data: { nome: row.nome, icon: '👤', cor, pessoaId: row.id, ordem: 0 },
    })
    return this.toDomain(row)
  }

  async update(id: number, input: UpdatePessoaInput): Promise<Pessoa> {
    const row = await this.prisma.pessoa.update({ where: { id }, data: input })
    // Mantem nome/cor da aba propria em sincronia
    if (input.nome !== undefined || input.cor !== undefined) {
      await this.prisma.abaDespesa.updateMany({
        where: { pessoaId: id },
        data: {
          ...(input.nome !== undefined && { nome: input.nome }),
          ...(input.cor !== undefined && { cor: input.cor }),
        },
      })
    }
    return this.toDomain(row)
  }

  async delete(id: number): Promise<void> {
    await this.prisma.pessoa.delete({ where: { id } })
  }

  private toDomain(row: PrismaPessoa): Pessoa {
    return { id: row.id, nome: row.nome, cor: row.cor, ativo: row.ativo, familiar: row.familiar }
  }
}
