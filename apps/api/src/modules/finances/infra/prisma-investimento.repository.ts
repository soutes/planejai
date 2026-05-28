import type { PrismaClient, Investimento as PrismaInvestimento } from '@prisma/client'
import type { IInvestimentoRepository } from '../domain/repositories/IInvestimentoRepository.js'
import type {
  Investimento,
  PosicaoComMetricas,
  CreateInvestimentoInput,
  UpdateInvestimentoInput,
  ListPosicoesFilter,
} from '../domain/entities/Investimento.js'

export class PrismaInvestimentoRepository implements IInvestimentoRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findMany(filter: ListPosicoesFilter): Promise<PosicaoComMetricas[]> {
    const rows = await this.prisma.investimento.findMany({
      where: {
        ...(filter.pessoaId !== undefined && { pessoaId: filter.pessoaId }),
        ...(filter.ativo !== undefined && { ativo: filter.ativo }),
      },
      include: {
        movimentacoes: true,
      },
      orderBy: [{ categoria: 'asc' }, { instituicao: 'asc' }],
    })

    return rows.map((row) => {
      const totalAportes = row.movimentacoes
        .filter((m) => m.tipo === 'APORTE')
        .reduce((s, m) => s + m.valor, 0)
      const totalResgates = row.movimentacoes
        .filter((m) => m.tipo === 'RESGATE')
        .reduce((s, m) => s + m.valor, 0)
      const totalRendimentos = row.movimentacoes
        .filter((m) => m.tipo === 'RENDIMENTO')
        .reduce((s, m) => s + m.valor, 0)

      const total_investido = totalAportes - totalResgates
      const saldo_atual = total_investido + totalRendimentos
      const rentabilidade_pct =
        total_investido > 0 ? (totalRendimentos / total_investido) * 100 : 0

      return {
        ...this.toDomain(row),
        saldo_atual,
        total_investido,
        total_rendimentos: totalRendimentos,
        rentabilidade_pct,
      }
    })
  }

  async findById(id: number): Promise<Investimento | null> {
    const row = await this.prisma.investimento.findUnique({ where: { id } })
    return row ? this.toDomain(row) : null
  }

  async create(input: CreateInvestimentoInput): Promise<Investimento> {
    const row = await this.prisma.investimento.create({
      data: {
        pessoaId: input.pessoaId ?? null,
        categoria: input.categoria,
        instituicao: input.instituicao ?? '',
        notas: input.notas ?? null,
      },
    })
    return this.toDomain(row)
  }

  async update(id: number, input: UpdateInvestimentoInput): Promise<Investimento> {
    const row = await this.prisma.investimento.update({
      where: { id },
      data: {
        ...(input.categoria !== undefined && { categoria: input.categoria }),
        ...(input.instituicao !== undefined && { instituicao: input.instituicao }),
        ...(input.ativo !== undefined && { ativo: input.ativo }),
        ...(input.notas !== undefined && { notas: input.notas }),
      },
    })
    return this.toDomain(row)
  }

  async deactivate(id: number): Promise<void> {
    // Hard delete — cascade apaga MovimentacaoInvestimento via schema onDelete: Cascade
    await this.prisma.investimento.delete({ where: { id } })
  }

  private toDomain(row: PrismaInvestimento): Investimento {
    return {
      id: row.id,
      pessoaId: row.pessoaId,
      categoria: row.categoria,
      instituicao: row.instituicao,
      ativo: row.ativo,
      notas: row.notas,
    }
  }
}
