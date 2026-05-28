import type {
  PrismaClient,
  MovimentacaoInvestimento as PrismaMovimentacao,
  Investimento as PrismaInvestimento,
} from '@prisma/client'
import type { IMovimentacaoInvestimentoRepository } from '../domain/repositories/IMovimentacaoInvestimentoRepository.js'
import type {
  MovimentacaoInvestimento,
  MovimentacaoComPosicao,
  EvolucaoMensal,
  CreateMovimentacaoInput,
  UpdateMovimentacaoInput,
  ListMovimentacoesFilter,
  TipoMovimentacao,
} from '../domain/entities/MovimentacaoInvestimento.js'

type PrismaMovComInv = PrismaMovimentacao & { investimento: PrismaInvestimento }

export class PrismaMovimentacaoInvestimentoRepository
  implements IMovimentacaoInvestimentoRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findMany(filter: ListMovimentacoesFilter): Promise<MovimentacaoComPosicao[]> {
    const rows = await this.prisma.movimentacaoInvestimento.findMany({
      where: {
        ...(filter.investimentoId !== undefined && { investimentoId: filter.investimentoId }),
        ...(filter.mesRef && { mesRef: filter.mesRef }),
        ...(filter.tipo && { tipo: filter.tipo }),
        ...(filter.pessoaId !== undefined && {
          investimento: { pessoaId: filter.pessoaId },
        }),
      },
      include: { investimento: true },
      orderBy: [{ mesRef: 'desc' }, { id: 'asc' }],
    })
    return rows.map(this.toDomainComPosicao)
  }

  async findById(id: number): Promise<MovimentacaoInvestimento | null> {
    const row = await this.prisma.movimentacaoInvestimento.findUnique({ where: { id } })
    return row ? this.toDomain(row) : null
  }

  async create(input: CreateMovimentacaoInput): Promise<MovimentacaoInvestimento> {
    const row = await this.prisma.movimentacaoInvestimento.create({
      data: {
        investimentoId: input.investimentoId,
        mesRef: input.mesRef,
        tipo: input.tipo,
        valor: input.valor,
        notas: input.notas ?? null,
      },
    })
    return this.toDomain(row)
  }

  async update(id: number, input: UpdateMovimentacaoInput): Promise<MovimentacaoInvestimento> {
    const row = await this.prisma.movimentacaoInvestimento.update({
      where: { id },
      data: {
        ...(input.mesRef !== undefined && { mesRef: input.mesRef }),
        ...(input.tipo !== undefined && { tipo: input.tipo }),
        ...(input.valor !== undefined && { valor: input.valor }),
        ...(input.notas !== undefined && { notas: input.notas }),
      },
    })
    return this.toDomain(row)
  }

  async delete(id: number): Promise<void> {
    await this.prisma.movimentacaoInvestimento.delete({ where: { id } })
  }

  async getEvolucao(
    pessoaId: number | null | undefined,
    meses: number,
  ): Promise<EvolucaoMensal[]> {
    // Calcular meses de referência (últimos N meses até o mês atual)
    const hoje = new Date()
    const mesRefs: string[] = []
    for (let i = meses - 1; i >= 0; i--) {
      const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1)
      const y = d.getFullYear()
      const m = String(d.getMonth() + 1).padStart(2, '0')
      mesRefs.push(`${y}-${m}`)
    }

    // Buscar todas as movimentações até o último mês dos últimos N meses
    const todasMovimentacoes = await this.prisma.movimentacaoInvestimento.findMany({
      where: {
        ...(pessoaId !== undefined && {
          investimento: { pessoaId },
        }),
        mesRef: { lte: mesRefs[mesRefs.length - 1] },
      },
      orderBy: { mesRef: 'asc' },
    })

    // Calcular saldo cumulativo mês a mês
    // Primeiro, agrupar por mês
    const porMes = new Map<string, { aportes: number; rendimentos: number; resgates: number }>()

    for (const mov of todasMovimentacoes) {
      if (!porMes.has(mov.mesRef)) {
        porMes.set(mov.mesRef, { aportes: 0, rendimentos: 0, resgates: 0 })
      }
      const entry = porMes.get(mov.mesRef)!
      if (mov.tipo === 'APORTE') entry.aportes += mov.valor
      else if (mov.tipo === 'RENDIMENTO') entry.rendimentos += mov.valor
      else if (mov.tipo === 'RESGATE') entry.resgates += mov.valor
    }

    // Calcular saldo cumulativo para cada mesRef da janela
    // Primeiro calcular saldo acumulado ANTES do primeiro mês da janela
    const primeiroMesDaJanela = mesRefs[0]
    let saldoAcumulado = 0
    for (const [mesRef, vals] of porMes.entries()) {
      if (mesRef < primeiroMesDaJanela) {
        saldoAcumulado += vals.aportes - vals.resgates + vals.rendimentos
      }
    }

    const resultado: EvolucaoMensal[] = []
    for (const mesRef of mesRefs) {
      const vals = porMes.get(mesRef) ?? { aportes: 0, rendimentos: 0, resgates: 0 }
      saldoAcumulado += vals.aportes - vals.resgates + vals.rendimentos
      resultado.push({
        mesRef,
        saldo: saldoAcumulado,
        aportes: vals.aportes,
        rendimentos: vals.rendimentos,
        resgates: vals.resgates,
      })
    }

    return resultado
  }

  private toDomain(row: PrismaMovimentacao): MovimentacaoInvestimento {
    return {
      id: row.id,
      investimentoId: row.investimentoId,
      mesRef: row.mesRef,
      tipo: row.tipo as TipoMovimentacao,
      valor: row.valor,
      notas: row.notas,
    }
  }

  private toDomainComPosicao(row: PrismaMovComInv): MovimentacaoComPosicao {
    return {
      id: row.id,
      investimentoId: row.investimentoId,
      mesRef: row.mesRef,
      tipo: row.tipo as TipoMovimentacao,
      valor: row.valor,
      notas: row.notas,
      posicao: {
        categoria: row.investimento.categoria,
        instituicao: row.investimento.instituicao,
      },
    }
  }
}
