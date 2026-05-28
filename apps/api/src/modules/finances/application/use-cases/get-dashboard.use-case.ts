import { HttpError } from '../../../../shared/errors.js'
import type { IDespesaRepository } from '../../domain/repositories/IDespesaRepository.js'
import type { IRendimentoRepository } from '../../domain/repositories/IRendimentoRepository.js'
import type { IInvestimentoRepository } from '../../domain/repositories/IInvestimentoRepository.js'
import type { IAbaRepository } from '../../domain/repositories/IAbaRepository.js'
import type { IOrcamentoRepository } from '../../domain/repositories/IOrcamentoRepository.js'
import type { IDivisaoEntryRepository } from '../../domain/repositories/IDivisaoEntryRepository.js'
import type { IPessoaRepository } from '../../domain/repositories/IPessoaRepository.js'

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

export interface DashboardOrcamento {
  abaId: number
  categoria: string
  valorMeta: number
  gasto: number
}

export interface DashboardDivisaoPendente {
  id: number
  pessoaId: number
  pessoaNome: string
  valorTotal: number
  direcao: string
  descricao: string
}

export interface DashboardData {
  mesRef: string
  totalDespesas: number
  totalRendimentos: number
  totalInvestido: number
  saldo: number
  despesasPorAba: DashboardPorAba[]
  despesasPorCategoria: DashboardPorCategoria[]
  orcamentos: DashboardOrcamento[]
  divisoesPendentes: DashboardDivisaoPendente[]
}

export class GetDashboardUseCase {
  constructor(
    private readonly despesaRepo: IDespesaRepository,
    private readonly rendimentoRepo: IRendimentoRepository,
    private readonly investimentoRepo: IInvestimentoRepository,
    private readonly abaRepo: IAbaRepository,
    private readonly orcamentoRepo: IOrcamentoRepository,
    private readonly divisaoRepo: IDivisaoEntryRepository,
    private readonly pessoaRepo: IPessoaRepository,
  ) {}

  async execute(mesRef: string, pessoaId?: number | null): Promise<DashboardData> {
    if (!/^\d{4}-\d{2}$/.test(mesRef)) throw HttpError.badRequest('mesRef deve ser YYYY-MM')

    const rendimentoFilter = pessoaId !== undefined ? { mesRef, pessoaId } : { mesRef }

    const [despesas, rendimentos, investimentos, abas, orcamentos, divisoes, pessoas] = await Promise.all([
      this.despesaRepo.findMany({ mesRef }),
      this.rendimentoRepo.findMany(rendimentoFilter),
      this.investimentoRepo.findMany({ ativo: true }),
      this.abaRepo.findAll(),
      this.orcamentoRepo.findMany({ mesRef }),
      this.divisaoRepo.findMany({ quitado: false }),
      this.pessoaRepo.findAll(),
    ])

    const abaMap = new Map(abas.map(a => [a.id, a]))
    const pessoaMap = new Map(pessoas.map(p => [p.id, p]))

    // Excluir split_auto (gerados por split familiar — já contabilizados na aba familiar)
    // cartao_ciclo: deduplica por (cartaoId, mesRef) — múltiplos uploads criam entradas redundantes;
    // mantém a de maior valor (= mais completa após merges)
    const cicloDedup = new Map<string, typeof despesas[0]>()
    for (const d of despesas) {
      if (d.tipo !== 'cartao_ciclo') continue
      const key = `${d.cartaoId ?? 0}-${d.mesRef}`
      const prev = cicloDedup.get(key)
      if (!prev || d.valor > prev.valor) cicloDedup.set(key, d)
    }
    const despesasReais = [
      ...despesas.filter(d => d.tipo !== 'split_auto' && d.tipo !== 'cartao_ciclo'),
      ...Array.from(cicloDedup.values()),
    ]

    const totalDespesas = despesasReais.reduce((sum, d) => sum + d.valor, 0)
    const totalRendimentos = rendimentos.reduce((sum, r) => sum + r.valor, 0)
    const totalInvestido = investimentos.reduce((sum, i) => sum + i.saldo_atual, 0)
    const saldo = totalRendimentos - totalDespesas

    const porAbaMap = new Map<number, number>()
    for (const d of despesasReais) {
      porAbaMap.set(d.abaId, (porAbaMap.get(d.abaId) ?? 0) + d.valor)
    }
    const despesasPorAba: DashboardPorAba[] = Array.from(porAbaMap.entries()).map(([abaId, total]) => ({
      abaId,
      abaNome: abaMap.get(abaId)?.nome ?? 'Desconhecida',
      abaCor: abaMap.get(abaId)?.cor ?? '#ccc',
      total,
    }))

    const porCatMap = new Map<string, number>()
    for (const d of despesasReais) {
      porCatMap.set(d.categoria, (porCatMap.get(d.categoria) ?? 0) + d.valor)
    }
    const despesasPorCategoria: DashboardPorCategoria[] = Array.from(porCatMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([categoria, total]) => ({
        categoria,
        total,
        percentual: totalDespesas > 0 ? (total / totalDespesas) * 100 : 0,
      }))

    // Orcamentos com gasto real do mês
    const dashOrcamentos: DashboardOrcamento[] = orcamentos.map(o => ({
      abaId: o.abaId,
      categoria: o.categoria,
      valorMeta: o.valorMeta,
      gasto: despesasReais
        .filter(d => d.abaId === o.abaId && d.categoria === o.categoria)
        .reduce((s, d) => s + d.valor, 0),
    }))

    // Divisões pendentes com nome da pessoa
    const dashDivisoes: DashboardDivisaoPendente[] = divisoes.map(d => ({
      id: d.id,
      pessoaId: d.pessoaId,
      pessoaNome: pessoaMap.get(d.pessoaId)?.nome ?? 'Desconhecida',
      valorTotal: d.valorTotal,
      direcao: d.direcao,
      descricao: d.descricao,
    }))

    return {
      mesRef,
      totalDespesas,
      totalRendimentos,
      totalInvestido,
      saldo,
      despesasPorAba,
      despesasPorCategoria,
      orcamentos: dashOrcamentos,
      divisoesPendentes: dashDivisoes,
    }
  }
}
