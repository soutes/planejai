import type { PrismaClient, DivisaoEntry as PrismaDivisao } from '@prisma/client'
import type { IDivisaoEntryRepository } from '../domain/repositories/IDivisaoEntryRepository.js'
import type { DivisaoEntry, CreateDivisaoInput, ListDivisoesFilter, DirecaoDivisao } from '../domain/entities/DivisaoEntry.js'

export class PrismaDivisaoEntryRepository implements IDivisaoEntryRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findMany(filter: ListDivisoesFilter): Promise<DivisaoEntry[]> {
    const rows = await this.prisma.divisaoEntry.findMany({
      where: {
        ...(filter.pessoaId !== undefined && { pessoaId: filter.pessoaId }),
        ...(filter.quitado !== undefined && { quitado: filter.quitado }),
      },
      orderBy: [{ quitado: 'asc' }, { mesRef: 'desc' }],
    })
    return rows.map(this.toDomain)
  }

  async findById(id: number): Promise<DivisaoEntry | null> {
    const row = await this.prisma.divisaoEntry.findUnique({ where: { id } })
    return row ? this.toDomain(row) : null
  }

  async create(input: CreateDivisaoInput): Promise<DivisaoEntry> {
    const row = await this.prisma.divisaoEntry.create({
      data: {
        pessoaId: input.pessoaId,
        mesRef: input.mesRef,
        descricao: input.descricao,
        valorTotal: input.valorTotal,
        direcao: input.direcao ?? 'a_receber',
        parcelado: input.parcelado ?? false,
        totalParcelas: input.totalParcelas ?? null,
        parcelaAtual: input.parcelaAtual ?? null,
        dataInicio: input.dataInicio ?? null,
        origemDespesaId: input.origemDespesaId ?? null,
        notas: input.notas ?? null,
      },
    })
    return this.toDomain(row)
  }

  async quitar(id: number): Promise<DivisaoEntry> {
    const row = await this.prisma.divisaoEntry.update({
      where: { id },
      data: { quitado: true },
    })
    return this.toDomain(row)
  }

  private toDomain(row: PrismaDivisao): DivisaoEntry {
    return {
      id: row.id,
      pessoaId: row.pessoaId,
      mesRef: row.mesRef,
      descricao: row.descricao,
      valorTotal: row.valorTotal,
      direcao: row.direcao as DirecaoDivisao,
      parcelado: row.parcelado,
      totalParcelas: row.totalParcelas,
      parcelaAtual: row.parcelaAtual,
      dataInicio: row.dataInicio,
      origemDespesaId: row.origemDespesaId,
      quitado: row.quitado,
      notas: row.notas,
    }
  }
}
