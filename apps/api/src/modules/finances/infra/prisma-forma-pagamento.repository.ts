import type { PrismaClient, FormaPagamento as PrismaFormaPagamento } from '@prisma/client'
import type { IFormaPagamentoRepository } from '../domain/repositories/IFormaPagamentoRepository.js'
import type { FormaPagamento, CreateFormaPagamentoInput, ListFormasPagamentoFilter } from '../domain/entities/FormaPagamento.js'

export class PrismaFormaPagamentoRepository implements IFormaPagamentoRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: number): Promise<FormaPagamento | null> {
    const row = await this.prisma.formaPagamento.findUnique({ where: { id } })
    return row ? this.toDomain(row) : null
  }

  async findMany(filter: ListFormasPagamentoFilter): Promise<FormaPagamento[]> {
    const rows = await this.prisma.formaPagamento.findMany({
      where: {
        pessoaId: filter.pessoaId,
        ...(filter.apenasAtivas !== false && { ativo: true }),
      },
      orderBy: [{ ordem: 'asc' }, { nome: 'asc' }],
    })
    return rows.map(this.toDomain)
  }

  async upsert(input: CreateFormaPagamentoInput): Promise<{ forma: FormaPagamento; created: boolean }> {
    let created = false
    const existing = await this.prisma.formaPagamento.findUnique({
      where: { pessoaId_nome: { pessoaId: input.pessoaId, nome: input.nome } },
    })
    if (!existing) {
      created = true
    }
    const row = await this.prisma.formaPagamento.upsert({
      where: { pessoaId_nome: { pessoaId: input.pessoaId, nome: input.nome } },
      create: {
        pessoaId: input.pessoaId,
        nome: input.nome,
        ativo: input.ativo ?? true,
        ordem: input.ordem ?? 0,
      },
      update: {
        ativo: true,
      },
    })
    return { forma: this.toDomain(row), created }
  }

  private toDomain(row: PrismaFormaPagamento): FormaPagamento {
    return {
      id: row.id,
      pessoaId: row.pessoaId,
      nome: row.nome,
      ativo: row.ativo,
      ordem: row.ordem,
    }
  }
}
