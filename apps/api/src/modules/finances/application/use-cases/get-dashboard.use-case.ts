import { HttpError } from '../../../../shared/errors.js'
import type { IDespesaRepository } from '../../domain/repositories/IDespesaRepository.js'
import type { IRendimentoRepository } from '../../domain/repositories/IRendimentoRepository.js'
import type { IInvestimentoRepository } from '../../domain/repositories/IInvestimentoRepository.js'
import type { IMovimentacaoInvestimentoRepository } from '../../domain/repositories/IMovimentacaoInvestimentoRepository.js'
import type { IAbaRepository } from '../../domain/repositories/IAbaRepository.js'
import type { IPessoaRepository } from '../../domain/repositories/IPessoaRepository.js'
import type { IFormaPagamentoRepository } from '../../domain/repositories/IFormaPagamentoRepository.js'
import type { Despesa } from '../../domain/entities/Despesa.js'
import {
  abasProprias,
  agregarMes,
  filtrarPorPessoaId,
  valorEfetivo,
  type EscopoPessoa,
} from '../../domain/services/escopo-despesas.js'

export interface DashboardPorAba {
  abaId: number
  abaNome: string
  abaCor: string
  total: number
}

export interface DashboardPorCategoria {
  categoria: string
  total: number
  percentual: number
}

export interface DashboardPorFormaPagamento {
  formaPagamentoId: number
  nome: string
  total: number
}

export interface DashboardSerieMes {
  mesRef: string
  despesas: number
  rendimentos: number
  saldo: number
}

export interface DashboardPatrimonio {
  valor: number
  classes: number
  serie: Array<{ mesRef: string; saldo: number }>
}

export interface DashboardData {
  mesRef: string
  totalDespesas: number
  totalRendimentos: number
  totalInvestido: number
  saldo: number
  qtdRendimentos: number
  despesasPorAba: DashboardPorAba[]
  despesasPorCategoria: DashboardPorCategoria[]
  despesasPorFormaPagamento: DashboardPorFormaPagamento[]
  serie: DashboardSerieMes[]
  patrimonio: DashboardPatrimonio
}

export interface GetDashboardInput {
  mesRef: string
  // number = pessoa | null = Familiar (só compartilhado) | undefined = global
  escopo: EscopoPessoa
  meses: number
}

function janelaMeses(mesRef: string, meses: number): string[] {
  const [y, m] = mesRef.split('-').map(Number)
  const refs: string[] = []
  for (let i = meses - 1; i >= 0; i--) {
    const d = new Date(y, m - 1 - i, 1)
    refs.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }
  return refs
}

// Dono do número do app: totais, quebras, série e patrimônio já no escopo pedido.
// Toda a regra de agregação vem de domain/services/escopo-despesas.
export class GetDashboardUseCase {
  constructor(
    private readonly despesaRepo: IDespesaRepository,
    private readonly rendimentoRepo: IRendimentoRepository,
    private readonly investimentoRepo: IInvestimentoRepository,
    private readonly movimentacaoRepo: IMovimentacaoInvestimentoRepository,
    private readonly abaRepo: IAbaRepository,
    private readonly pessoaRepo: IPessoaRepository,
    private readonly formaPagamentoRepo: IFormaPagamentoRepository,
  ) {}

  async execute(input: GetDashboardInput): Promise<DashboardData> {
    const { mesRef, escopo, meses } = input
    if (!/^\d{4}-\d{2}$/.test(mesRef)) throw HttpError.badRequest('mesRef deve ser YYYY-MM')
    if (meses < 1 || meses > 60) throw HttpError.badRequest('meses deve estar entre 1 e 60')

    const refs = janelaMeses(mesRef, meses)

    const [
      despesasJanela, rendimentosJanela, investimentos, evolucao,
      abas, pessoas,
    ] = await Promise.all([
      this.despesaRepo.findMany({ mesRefIn: refs }),
      this.rendimentoRepo.findMany({ mesRefIn: refs }),
      this.investimentoRepo.findMany({ ativo: true }),
      this.movimentacaoRepo.getEvolucao(escopo, meses),
      this.abaRepo.findAll(),
      this.pessoaRepo.findAll(),
    ])

    if (typeof escopo === 'number' && !pessoas.some((p) => p.id === escopo)) {
      throw HttpError.badRequest(`Pessoa ${escopo} não encontrada`)
    }

    const abasDaPessoa = abasProprias(abas, escopo)

    // Agrupa a janela por mês para agregar cada um no escopo
    const despPorMes = new Map<string, Despesa[]>(refs.map((m) => [m, []]))
    for (const d of despesasJanela) despPorMes.get(d.mesRef)?.push(d)
    const rendPorMes = new Map<string, Array<{ pessoaId: number | null; valor: number }>>(
      refs.map((m) => [m, []]),
    )
    for (const r of rendimentosJanela) rendPorMes.get(r.mesRef)?.push(r)

    const serie: DashboardSerieMes[] = refs.map((m) => {
      const agg = agregarMes(despPorMes.get(m) ?? [], rendPorMes.get(m) ?? [], escopo, abasDaPessoa)
      return {
        mesRef: m,
        despesas: agg.totalDespesas,
        rendimentos: agg.totalRendimentos,
        saldo: agg.saldo,
      }
    })

    // Mês corrente = último da janela
    const atual = agregarMes(
      despPorMes.get(mesRef) ?? [],
      rendPorMes.get(mesRef) ?? [],
      escopo,
      abasDaPessoa,
    )
    const { despesas: despesasEscopo, totalDespesas, totalRendimentos, saldo } = atual

    const investimentosEscopo = filtrarPorPessoaId(investimentos, escopo)
    const totalInvestido = investimentosEscopo.reduce((s, i) => s + i.saldo_atual, 0)

    const abaMap = new Map(abas.map((a) => [a.id, a]))

    const porAbaMap = new Map<number, number>()
    for (const d of despesasEscopo) {
      porAbaMap.set(d.abaId, (porAbaMap.get(d.abaId) ?? 0) + valorEfetivo(d, escopo))
    }
    const despesasPorAba: DashboardPorAba[] = Array.from(porAbaMap.entries())
      .map(([abaId, total]) => ({
        abaId,
        abaNome: abaMap.get(abaId)?.nome ?? 'Desconhecida',
        abaCor: abaMap.get(abaId)?.cor ?? '#ccc',
        total,
      }))
      .sort((a, b) => b.total - a.total)

    const porCatMap = new Map<string, number>()
    for (const d of despesasEscopo) {
      porCatMap.set(d.categoria, (porCatMap.get(d.categoria) ?? 0) + valorEfetivo(d, escopo))
    }
    const despesasPorCategoria: DashboardPorCategoria[] = Array.from(porCatMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([categoria, total]) => ({
        categoria,
        total,
        percentual: totalDespesas > 0 ? (total / totalDespesas) * 100 : 0,
      }))

    // Formas de pagamento pertencem a uma pessoa — só faz sentido em escopo de pessoa
    let despesasPorFormaPagamento: DashboardPorFormaPagamento[] = []
    if (typeof escopo === 'number') {
      const formas = await this.formaPagamentoRepo.findMany({ pessoaId: escopo, apenasAtivas: false })
      const formaMap = new Map(formas.map((f) => [f.id, f.nome]))
      const porFormaMap = new Map<number, number>()
      for (const d of despesasEscopo) {
        if (d.formaPagamentoId != null && formaMap.has(d.formaPagamentoId)) {
          porFormaMap.set(
            d.formaPagamentoId,
            (porFormaMap.get(d.formaPagamentoId) ?? 0) + valorEfetivo(d, escopo),
          )
        }
      }
      despesasPorFormaPagamento = Array.from(porFormaMap.entries())
        .map(([formaPagamentoId, total]) => ({
          formaPagamentoId,
          nome: formaMap.get(formaPagamentoId) ?? 'Desconhecida',
          total,
        }))
        .sort((a, b) => b.total - a.total)
    }

    return {
      mesRef,
      totalDespesas,
      totalRendimentos,
      totalInvestido,
      saldo,
      qtdRendimentos: atual.rendimentos.length,
      despesasPorAba,
      despesasPorCategoria,
      despesasPorFormaPagamento,
      serie,
      patrimonio: {
        valor: totalInvestido,
        classes: new Set(investimentosEscopo.map((i) => i.categoria)).size,
        serie: evolucao.map((e) => ({ mesRef: e.mesRef, saldo: e.saldo })),
      },
    }
  }
}
