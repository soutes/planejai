import type { PrismaClient, Investimento as PrismaInvestimento } from '@prisma/client'
import type { IInvestimentoRepository } from '../domain/repositories/IInvestimentoRepository.js'
import type { Investimento, UpsertInvestimentoInput, ListInvestimentosFilter } from '../domain/entities/Investimento.js'

export class PrismaInvestimentoRepository implements IInvestimentoRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findMany(filter: ListInvestimentosFilter): Promise<Investimento[]> {
    const rows = await this.prisma.investimento.findMany({
      where: {
        ...(filter.mesRef && { mesRef: filter.mesRef }),
        ...(filter.pessoaId !== undefined && { pessoaId: filter.pessoaId }),
      },
      orderBy: [{ mesRef: 'desc' }, { categoria: 'asc' }],
    })
    return rows.map(this.toDomain)
  }

  async findById(id: number): Promise<Investimento | null> {
    const row = await this.prisma.investimento.findUnique({ where: { id } })
    return row ? this.toDomain(row) : null
  }

  async upsert(input: UpsertInvestimentoInput): Promise<Investimento> {
    const pessoaId = input.pessoaId ?? null
    const data = {
      pessoaId,
      mesRef: input.mesRef,
      categoria: input.categoria,
      instituicao: input.instituicao ?? '',
      valor: input.valor,
      aporteMe: input.aporteMe ?? 0,
      notas: input.notas ?? null,
    }
    const row = await this.prisma.investimento.upsert({
      where: {
        pessoaId_mesRef_categoria_instituicao: {
          pessoaId,
          mesRef: input.mesRef,
          categoria: input.categoria,
          instituicao: input.instituicao ?? '',
        },
      },
      create: data,
      update: { valor: data.valor, aporteMe: data.aporteMe, notas: data.notas },
    })
    return this.toDomain(row)
  }

  async delete(id: number): Promise<void> {
    await this.prisma.investimento.delete({ where: { id } })
  }

  private toDomain(row: PrismaInvestimento): Investimento {
    return {
      id: row.id,
      pessoaId: row.pessoaId,
      mesRef: row.mesRef,
      categoria: row.categoria,
      instituicao: row.instituicao,
      valor: row.valor,
      aporteMe: row.aporteMe,
      notas: row.notas,
    }
  }
}
