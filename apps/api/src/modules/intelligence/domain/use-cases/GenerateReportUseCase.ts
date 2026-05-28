import { HttpError } from '../../../../shared/errors.js'
import type { IAnthropicRepository } from '../repositories/IAnthropicRepository.js'
import type { IDespesaRepository } from '../../../finances/domain/repositories/IDespesaRepository.js'
import type { IRendimentoRepository } from '../../../finances/domain/repositories/IRendimentoRepository.js'
import type { IInvestimentoRepository } from '../../../finances/domain/repositories/IInvestimentoRepository.js'
import { PROMPTS } from '../prompts/index.js'

export interface GenerateReportInput {
  mesRef: string
}

export interface RelatorioIA {
  titulo: string
  resumo: string
  destaques: Array<{ tipo: string; titulo: string; descricao: string }>
  alertas: string[]
  recomendacoes: string[]
  comentario_final: string
}

export class GenerateReportUseCase {
  constructor(
    private readonly anthropicRepo: IAnthropicRepository,
    private readonly despesaRepo: IDespesaRepository,
    private readonly rendimentoRepo: IRendimentoRepository,
    private readonly investimentoRepo: IInvestimentoRepository,
  ) {}

  async execute(input: GenerateReportInput): Promise<RelatorioIA> {
    if (!/^\d{4}-\d{2}$/.test(input.mesRef)) {
      throw HttpError.badRequest('mesRef deve ser YYYY-MM')
    }

    const [despesas, rendimentos, investimentos] = await Promise.all([
      this.despesaRepo.findMany({ mesRef: input.mesRef }),
      this.rendimentoRepo.findMany({ mesRef: input.mesRef }),
      this.investimentoRepo.findMany({ ativo: true }),
    ])

    const despesasReais = despesas.filter(d => d.tipo !== 'cartao_ciclo' && d.tipo !== 'split_auto')
    const totalDespesas = despesasReais.reduce((s, d) => s + d.valor, 0)
    const totalRendimentos = rendimentos.reduce((s, r) => s + r.valor, 0)
    const totalInvestido = investimentos.reduce((s, i) => s + i.saldo_atual, 0)

    const porCategoria = despesasReais.reduce<Record<string, number>>((acc, d) => {
      acc[d.categoria] = (acc[d.categoria] ?? 0) + d.valor
      return acc
    }, {})

    const contexto = {
      mesRef: input.mesRef,
      totalDespesas,
      totalRendimentos,
      saldo: totalRendimentos - totalDespesas,
      totalInvestido,
      despesasPorCategoria: Object.entries(porCategoria)
        .sort((a, b) => b[1] - a[1])
        .map(([cat, val]) => ({ categoria: cat, valor: val })),
      qtdDespesas: despesasReais.length,
      qtdRendimentos: rendimentos.length,
    }

    const systemPrompt = PROMPTS.generateReport()

    const raw = await this.anthropicRepo.call({
      systemPrompt,
      messages: [
        {
          role: 'user',
          content: `Gere o relatório financeiro para o mês ${input.mesRef} com base nos seguintes dados:\n\n${JSON.stringify(contexto, null, 2)}`,
        },
      ],
    })

    let relatorio: RelatorioIA
    try {
      relatorio = JSON.parse(raw) as RelatorioIA
    } catch {
      throw HttpError.unprocessable('Resposta da IA não é um JSON válido')
    }

    return relatorio
  }
}
