import type { PrismaClient, Despesa as PrismaDespesa, DespesaSplit as PrismaSplit } from '@prisma/client'
import type { IDespesaRepository } from '../domain/repositories/IDespesaRepository.js'
import type { Despesa, CreateDespesaInput, UpdateDespesaInput, ListDespesasFilter } from '../domain/entities/Despesa.js'
import type { DespesaSplit, CreateDespesaSplitInput } from '../domain/entities/DespesaSplit.js'

export class PrismaDespesaRepository implements IDespesaRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findMany(filter: ListDespesasFilter): Promise<Despesa[]> {
    const rows = await this.prisma.despesa.findMany({
      where: {
        ...(filter.abaId !== undefined && { abaId: filter.abaId }),
        ...(filter.mesRef !== undefined && { mesRef: filter.mesRef }),
        ...(filter.cartaoId !== undefined && { cartaoId: filter.cartaoId }),
      },
      orderBy: [{ mesRef: 'desc' }, { id: 'desc' }],
      include: { splits: true },
    })
    return rows.map((r) => ({
      ...this.toDomain(r),
      splits: r.splits.map(this.toSplitDomain),
    }))
  }

  async findById(id: number): Promise<Despesa | null> {
    const row = await this.prisma.despesa.findUnique({ where: { id } })
    return row ? this.toDomain(row) : null
  }

  async create(input: CreateDespesaInput): Promise<Despesa> {
    const row = await this.prisma.despesa.create({
      data: {
        abaId: input.abaId,
        mesRef: input.mesRef,
        data: input.data ?? null,
        descricao: input.descricao,
        categoria: input.categoria,
        valor: input.valor,
        notas: input.notas ?? null,
        tipo: input.tipo ?? 'manual',
        recorrente: input.recorrente ?? false,
        totalRepeticoes: input.totalRepeticoes ?? null,
        parcelaNum: input.parcelaNum ?? null,
        totalParcelas: input.totalParcelas ?? null,
        emFaturaCartao: input.emFaturaCartao ?? false,
        cartaoId: input.cartaoId ?? null,
        somenteMeu: input.somenteMeu ?? false,
        origemId: input.origemId ?? null,
      },
    })
    return this.toDomain(row)
  }

  async update(id: number, input: UpdateDespesaInput): Promise<Despesa> {
    const row = await this.prisma.despesa.update({
      where: { id },
      data: input,
    })
    return this.toDomain(row)
  }

  async delete(id: number): Promise<void> {
    await this.prisma.despesa.delete({ where: { id } })
  }

  async deleteMany(origemId: number): Promise<void> {
    await this.prisma.despesa.deleteMany({
      where: { OR: [{ id: origemId }, { origemId }] },
    })
  }

  async findSplits(despesaId: number): Promise<DespesaSplit[]> {
    const rows = await this.prisma.despesaSplit.findMany({ where: { despesaId } })
    return rows.map(this.toSplitDomain)
  }

  async setSplits(despesaId: number, splits: CreateDespesaSplitInput[]): Promise<DespesaSplit[]> {
    await this.prisma.despesaSplit.deleteMany({ where: { despesaId } })
    const rows = await this.prisma.despesaSplit.createManyAndReturn({
      data: splits.map(s => ({ despesaId, ...s })),
    })
    return rows.map(this.toSplitDomain)
  }

  async redistributeSplitsOnPessoaRemoval(pessoaId: number): Promise<void> {
    const affected = await this.prisma.despesaSplit.findMany({ where: { pessoaId } })
    for (const target of affected) {
      const all = await this.prisma.despesaSplit.findMany({ where: { despesaId: target.despesaId } })
      const others = all.filter((s) => s.pessoaId !== pessoaId)
      const sumOthers = others.reduce((a, s) => a + s.ratio, 0)
      if (others.length === 0 || sumOthers <= 0) {
        // Sem ninguem pra rebalancear — só remove split alvo, mantem despesa
        await this.prisma.despesaSplit.delete({ where: { id: target.id } })
        continue
      }
      const despesa = await this.prisma.despesa.findUnique({ where: { id: target.despesaId } })
      const valor = despesa?.valor ?? 0
      await this.prisma.$transaction([
        ...others.map((o) =>
          this.prisma.despesaSplit.update({
            where: { id: o.id },
            data: {
              ratio: o.ratio / sumOthers,
              valorCalculado: valor * (o.ratio / sumOthers),
            },
          }),
        ),
        this.prisma.despesaSplit.delete({ where: { id: target.id } }),
      ])
    }
  }

  private toDomain(row: PrismaDespesa): Despesa {
    return {
      id: row.id,
      abaId: row.abaId,
      mesRef: row.mesRef,
      data: row.data,
      descricao: row.descricao,
      categoria: row.categoria,
      valor: row.valor,
      notas: row.notas,
      tipo: row.tipo as Despesa['tipo'],
      recorrente: row.recorrente,
      totalRepeticoes: row.totalRepeticoes,
      origemId: row.origemId,
      parcelaNum: row.parcelaNum,
      totalParcelas: row.totalParcelas,
      emFaturaCartao: row.emFaturaCartao,
      cartaoId: row.cartaoId,
      somenteMeu: row.somenteMeu,
    }
  }

  private toSplitDomain(row: PrismaSplit): DespesaSplit {
    return {
      id: row.id,
      despesaId: row.despesaId,
      pessoaId: row.pessoaId,
      ratio: row.ratio,
      valorCalculado: row.valorCalculado,
    }
  }
}
