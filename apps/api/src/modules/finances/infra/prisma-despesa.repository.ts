import type { PrismaClient, Despesa as PrismaDespesa, DespesaSplit as PrismaSplit, FormaPagamento as PrismaFormaPagamento } from '@prisma/client'
import type { IDespesaRepository } from '../domain/repositories/IDespesaRepository.js'
import type { Despesa, CreateDespesaInput, UpdateDespesaInput, ListDespesasFilter } from '../domain/entities/Despesa.js'
import type { DespesaSplit, CreateDespesaSplitInput } from '../domain/entities/DespesaSplit.js'
import { recalcularSplitsProporcionais } from '../domain/services/fatura-transacoes.js'

export class PrismaDespesaRepository implements IDespesaRepository {
  // `jaTransacional` = este repo foi religado ao client de uma transação aberta
  // (ver PrismaUnitOfWork). O client transacional do Prisma NÃO expõe
  // `$transaction` — chamar de dentro estoura `TypeError: this.prisma.$transaction
  // is not a function`. Quem já está numa transação apenas executa; a atomicidade
  // é da transação externa.
  constructor(
    private readonly prisma: PrismaClient,
    private readonly jaTransacional = false,
  ) {}

  private async atomico<T>(fn: (tx: PrismaClient) => Promise<T>): Promise<T> {
    if (this.jaTransacional) return fn(this.prisma)
    return this.prisma.$transaction(async (tx) => fn(tx as unknown as PrismaClient))
  }

  async findMany(filter: ListDespesasFilter): Promise<Despesa[]> {
    const rows = await this.prisma.despesa.findMany({
      where: {
        ...(filter.abaId !== undefined && { abaId: filter.abaId }),
        ...(filter.mesRef !== undefined && { mesRef: filter.mesRef }),
        ...(filter.mesRefIn !== undefined && { mesRef: { in: filter.mesRefIn } }),
        ...(filter.cartaoId !== undefined && { cartaoId: filter.cartaoId }),
      },
      orderBy: [{ mesRef: 'desc' }, { id: 'desc' }],
      include: { splits: true, formaPagamento: true },
    })
    return rows.map((r) => ({
      ...this.toDomain(r, r.formaPagamento),
      splits: r.splits.map(this.toSplitDomain),
    }))
  }

  async findById(id: number): Promise<Despesa | null> {
    const row = await this.prisma.despesa.findUnique({ where: { id }, include: { formaPagamento: true } })
    return row ? this.toDomain(row, row.formaPagamento) : null
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
        pagadorId: input.pagadorId ?? null,
        formaPagamentoId: input.formaPagamentoId ?? null,
      },
    })
    return this.toDomain(row)
  }

  async update(id: number, input: UpdateDespesaInput): Promise<Despesa> {
    const { splits, ...scalar } = input
    const row = await this.prisma.despesa.update({
      where: { id },
      data: scalar,
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
    const despesa = await this.prisma.despesa.findUnique({ where: { id: despesaId }, select: { valor: true } })
    if (!despesa) throw new Error(`Despesa ${despesaId} não encontrada`)
    return this.atomico(async (tx) => {
      const existing = await tx.despesaSplit.findMany({ where: { despesaId }, orderBy: { id: 'asc' } })
      const byPerson = new Map(existing.map((split) => [split.pessoaId, split]))
      const normalized = splits.map((split, index) => {
        const rounded = Math.round(split.valorCalculado * 100) / 100
        return { ...split, valorCalculado: rounded, index }
      })
      const roundedTotal = normalized.reduce((sum, split) => sum + split.valorCalculado, 0)
      if (normalized.length > 0) normalized[normalized.length - 1].valorCalculado = Math.round((normalized[normalized.length - 1].valorCalculado + despesa.valor - roundedTotal) * 100) / 100
      const people = new Set<number>()
      const rows = []
      for (const split of normalized) {
        if (people.has(split.pessoaId)) throw new Error('Pessoa duplicada no split')
        people.add(split.pessoaId)
        const old = byPerson.get(split.pessoaId)
        if (old && split.valorCalculado + 0.0001 < old.valorQuitado) throw new Error('Novo valor do split não cobre o valor já quitado')
        const row = old
          ? await tx.despesaSplit.update({ where: { id: old.id }, data: { ratio: split.ratio, valorCalculado: split.valorCalculado } })
          : await tx.despesaSplit.create({ data: { despesaId, pessoaId: split.pessoaId, ratio: split.ratio, valorCalculado: split.valorCalculado } })
        rows.push(row)
      }
      await tx.despesaSplit.deleteMany({ where: { despesaId, ...(people.size > 0 ? { pessoaId: { notIn: Array.from(people) } } : {}) } })
      return rows.map(this.toSplitDomain)
    })
  }

  async resyncCartaoCiclo(despesaId: number, valor: number): Promise<DespesaSplit[]> {
    return this.atomico(async (tx) => {
      await tx.despesa.update({ where: { id: despesaId }, data: { valor } })
      const existing = await tx.despesaSplit.findMany({ where: { despesaId }, orderBy: { id: 'asc' } })
      if (existing.length === 0) return []
      // Regra de rateio única — mesma função usada na importação de fatura.
      const recalculados = recalcularSplitsProporcionais(existing, valor)
      const rows = []
      for (const r of recalculados) {
        rows.push(await tx.despesaSplit.update({ where: { id: r.id }, data: { valorCalculado: r.valorCalculado } }))
      }
      return rows.map(this.toSplitDomain)
    })
  }

  async findByCartaoCiclo(cartaoId: number, mesRef: string): Promise<Despesa | null> {
    // orderBy explícito: se houver duplicatas legado do mesmo cartão/mês, esta
    // consulta precisa mirar a mesma linha que despesasReais() escolhe na leitura
    // (a de maior id) — senão o resync grava numa linha e o Dashboard soma outra.
    const row = await this.prisma.despesa.findFirst({
      where: { cartaoId, mesRef, tipo: 'cartao_ciclo' },
      orderBy: { id: 'desc' },
    })
    return row ? this.toDomain(row) : null
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
      await this.atomico(async (tx) => {
        for (const o of others) {
          await tx.despesaSplit.update({
            where: { id: o.id },
            data: {
              ratio: o.ratio / sumOthers,
              valorCalculado: valor * (o.ratio / sumOthers),
            },
          })
        }
        await tx.despesaSplit.delete({ where: { id: target.id } })
      })
    }
  }

  private toDomain(row: PrismaDespesa, forma?: PrismaFormaPagamento | null): Despesa {
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
      pagadorId: row.pagadorId,
      formaPagamentoId: row.formaPagamentoId,
      formaPagamentoNome: forma?.nome ?? null,
    }
  }

  private toSplitDomain(row: PrismaSplit): DespesaSplit {
    return {
      id: row.id,
      despesaId: row.despesaId,
      pessoaId: row.pessoaId,
      ratio: row.ratio,
      valorCalculado: row.valorCalculado,
      valorQuitado: row.valorQuitado,
    }
  }
}
