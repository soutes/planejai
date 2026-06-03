import type { PrismaClient } from '@prisma/client'
import { HttpError } from '../../../shared/errors.js'
import type { IAcertoRepository } from '../domain/repositories/IAcertoRepository.js'
import type {
  SaldoPessoa,
  SaldoDespesa,
  AcertoEntry,
  CreateAcertoInput,
  HistoricoFilter,
} from '../domain/entities/Acerto.js'

export class PrismaAcertoRepository implements IAcertoRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async calcularSaldo(mesRef: string, incluirAnteriores: boolean, membros?: number[]): Promise<SaldoPessoa[]> {
    const membroSet = membros && membros.length > 0 ? new Set(membros) : null

    const pessoas = await this.prisma.pessoa.findMany({
      where: {
        familiar: true,
        padrao: false,
        ativo: true,
        ...(membroSet ? { id: { in: Array.from(membroSet) } } : {}),
      },
    })

    // Mapa abaId → dono (pessoaId). Aba de grupo tem dono null.
    const abas = await this.prisma.abaDespesa.findMany({ select: { id: true, pessoaId: true } })
    const abaOwner = new Map(abas.map((a) => [a.id, a.pessoaId]))

    // Quem fronteou o pagamento: pagador explícito (cartão de grupo) ou, na falta, o dono da aba.
    const payerOf = (d: { pagadorId: number | null; abaId: number }): number | null =>
      d.pagadorId ?? abaOwner.get(d.abaId) ?? null

    // Despesa pertence ao grupo quando TODOS os splits estão dentro dos membros.
    const noGrupo = (splits: { pessoaId: number }[]): boolean =>
      !membroSet || splits.every((s) => membroSet.has(s.pessoaId))

    const result: SaldoPessoa[] = []
    const mesFilter = incluirAnteriores ? { lte: mesRef } : mesRef

    for (const pessoa of pessoas) {
      // Abas próprias desta pessoa (despesas onde ela é a pagadora implícita)
      const myAbas = await this.prisma.abaDespesa.findMany({ where: { pessoaId: pessoa.id }, select: { id: true } })
      const myAbaIds = myAbas.map((a) => a.id)

      // O que PESSOA deve: splits dela em despesas que OUTRA pessoa pagou
      const splitsOwesRaw = await this.prisma.despesaSplit.findMany({
        where: {
          pessoaId: pessoa.id,
          despesa: { somenteMeu: false, mesRef: mesFilter },
        },
        include: { despesa: { include: { splits: true } } },
        orderBy: [{ despesa: { data: 'asc' } }, { despesa: { id: 'asc' } }],
      })
      const splitsOwes = splitsOwesRaw.filter(
        (s) => noGrupo(s.despesa.splits) && payerOf(s.despesa) !== pessoa.id,
      )

      // O que PESSOA é creditada: splits de OUTROS em despesas que PESSOA pagou
      // (pagador explícito = ela, ou despesa numa aba dela sem pagador explícito)
      const splitsCreditRaw = await this.prisma.despesaSplit.findMany({
        where: {
          pessoaId: { not: pessoa.id },
          despesa: {
            somenteMeu: false,
            mesRef: mesFilter,
            OR: [
              { pagadorId: pessoa.id },
              ...(myAbaIds.length > 0 ? [{ pagadorId: null, abaId: { in: myAbaIds } }] : []),
            ],
          },
        },
        include: { despesa: { include: { splits: true } } },
      })
      const splitsCredit = splitsCreditRaw.filter((s) => noGrupo(s.despesa.splits))

      const totalOwes = splitsOwes.reduce((a, s) => a + (s.valorCalculado - s.valorQuitado), 0)
      const totalCredit = splitsCredit.reduce((a, s) => a + (s.valorCalculado - s.valorQuitado), 0)
      const saldoTotal = totalOwes - totalCredit

      if (Math.abs(saldoTotal) < 0.01) continue

      const owesThisMonth = splitsOwes
        .filter((s) => s.despesa.mesRef === mesRef)
        .reduce((a, s) => a + (s.valorCalculado - s.valorQuitado), 0)
      const creditThisMonth = splitsCredit
        .filter((s) => s.despesa.mesRef === mesRef)
        .reduce((a, s) => a + (s.valorCalculado - s.valorQuitado), 0)

      const despesas: SaldoDespesa[] = splitsOwes
        .filter((s) => s.valorCalculado - s.valorQuitado > 0.001)
        .map((s) => ({
          despesaId: s.despesaId,
          descricao: s.despesa.descricao,
          categoria: s.despesa.categoria,
          valorTotal: s.despesa.valor,
          valorProporcional: s.valorCalculado,
          valorQuitado: s.valorQuitado,
          saldoPendente: s.valorCalculado - s.valorQuitado,
          data: s.despesa.data,
          mesRef: s.despesa.mesRef,
          splitId: s.id,
        }))

      result.push({
        pessoaId: pessoa.id,
        nome: pessoa.nome,
        cor: pessoa.cor,
        saldoMesAtual: owesThisMonth - creditThisMonth,
        pendenciasAnteriores: 0,
        saldoTotal,
        direcao: saldoTotal > 0 ? 'a_receber' : 'a_pagar',
        despesas,
      })
    }

    return result
  }

  async registrar(input: CreateAcertoInput): Promise<AcertoEntry> {
    const pessoa = await this.prisma.pessoa.findUnique({ where: { id: input.pessoaId } })
    if (!pessoa) throw new HttpError(404, 'Pessoa não encontrada')

    // Buscar splits pendentes ordenados FIFO (Despesa.data ASC, Despesa.id ASC)
    const splits = await this.prisma.despesaSplit.findMany({
      where: {
        pessoaId: input.pessoaId,
        despesa: { somenteMeu: false },
      },
      include: { despesa: true },
      orderBy: [{ despesa: { data: 'asc' } }, { despesa: { id: 'asc' } }],
    })

    // Pagador da despesa: explícito ou dono da aba. Splits de despesas que a própria
    // pessoa fronteou não são dívida dela → não entram na quitação.
    const abas = await this.prisma.abaDespesa.findMany({ select: { id: true, pessoaId: true } })
    const abaOwner = new Map(abas.map((a) => [a.id, a.pessoaId]))
    const payerOf = (d: { pagadorId: number | null; abaId: number }): number | null =>
      d.pagadorId ?? abaOwner.get(d.abaId) ?? null

    const pendentes = splits.filter(
      (s) => s.valorCalculado - s.valorQuitado > 0.001 && payerOf(s.despesa) !== input.pessoaId,
    )

    let valorRestante = input.valor
    const cobertura: Array<{ splitId: number; valorCoberto: number; novoQuitado: number }> = []

    for (const split of pendentes) {
      if (valorRestante <= 0.001) break
      const saldoPendente = split.valorCalculado - split.valorQuitado
      const cobrir = Math.min(saldoPendente, valorRestante)
      cobertura.push({
        splitId: split.id,
        valorCoberto: cobrir,
        novoQuitado: split.valorQuitado + cobrir,
      })
      valorRestante -= cobrir
    }

    const acerto = await this.prisma.$transaction(async (tx) => {
      const entry = await tx.acertoEntry.create({
        data: {
          pessoaId: input.pessoaId,
          mesRef: input.mesRef,
          valor: input.valor,
          data: input.data,
          formaPagamento: input.formaPagamento,
          observacao: input.observacao ?? null,
          splits: {
            create: cobertura.map((c) => ({
              splitId: c.splitId,
              valorCoberto: c.valorCoberto,
            })),
          },
        },
        include: {
          pessoa: true,
          splits: { include: { split: { include: { despesa: true } } } },
        },
      })

      for (const c of cobertura) {
        await tx.despesaSplit.update({
          where: { id: c.splitId },
          data: { valorQuitado: c.novoQuitado },
        })
      }

      return entry
    })

    return this.toDomain(acerto)
  }

  async deletar(id: number): Promise<void> {
    const acerto = await this.prisma.acertoEntry.findUnique({
      where: { id },
      include: { splits: true },
    })
    if (!acerto) throw new HttpError(404, 'Acerto não encontrado')

    await this.prisma.$transaction(async (tx) => {
      for (const s of acerto.splits) {
        await tx.despesaSplit.update({
          where: { id: s.splitId },
          data: { valorQuitado: { decrement: s.valorCoberto } },
        })
      }
      await tx.acertoEntry.delete({ where: { id } })
    })
  }

  async listarHistorico(filter: HistoricoFilter): Promise<AcertoEntry[]> {
    const entries = await this.prisma.acertoEntry.findMany({
      where: {
        ...(filter.pessoaId ? { pessoaId: filter.pessoaId } : {}),
        ...(filter.mesRefInicio || filter.mesRefFim
          ? {
              mesRef: {
                ...(filter.mesRefInicio ? { gte: filter.mesRefInicio } : {}),
                ...(filter.mesRefFim ? { lte: filter.mesRefFim } : {}),
              },
            }
          : {}),
      },
      include: {
        pessoa: true,
        splits: { include: { split: { include: { despesa: true } } } },
      },
      orderBy: { criadoEm: 'desc' },
    })

    return entries.map((e) => this.toDomain(e))
  }

  async despesaTemAcerto(despesaId: number): Promise<boolean> {
    const found = await this.prisma.acertoDespesaSplit.findFirst({
      where: { split: { despesaId } },
    })
    return found !== null
  }

  private toDomain(e: any): AcertoEntry {
    return {
      id: e.id,
      pessoaId: e.pessoaId,
      pessoa: { id: e.pessoa.id, nome: e.pessoa.nome, cor: e.pessoa.cor },
      mesRef: e.mesRef,
      valor: e.valor,
      data: e.data,
      formaPagamento: e.formaPagamento,
      observacao: e.observacao,
      criadoEm: e.criadoEm,
      splits: e.splits.map((s: any) => ({
        id: s.id,
        splitId: s.splitId,
        valorCoberto: s.valorCoberto,
        despesa: {
          id: s.split.despesa.id,
          descricao: s.split.despesa.descricao,
          data: s.split.despesa.data,
          mesRef: s.split.despesa.mesRef,
        },
      })),
    }
  }
}
