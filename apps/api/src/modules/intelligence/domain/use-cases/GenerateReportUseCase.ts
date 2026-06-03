import { HttpError } from '../../../../shared/errors.js'
import type { IAnthropicRepository } from '../repositories/IAnthropicRepository.js'
import type { IDespesaRepository } from '../../../finances/domain/repositories/IDespesaRepository.js'
import type { IRendimentoRepository } from '../../../finances/domain/repositories/IRendimentoRepository.js'
import type { IInvestimentoRepository } from '../../../finances/domain/repositories/IInvestimentoRepository.js'
import type { IAbaRepository } from '../../../finances/domain/repositories/IAbaRepository.js'
import type { IPessoaRepository } from '../../../finances/domain/repositories/IPessoaRepository.js'
import type { ICartaoRepository } from '../../../finances/domain/repositories/ICartaoRepository.js'
import type { IFaturaRepository } from '../../../finances/domain/repositories/IFaturaRepository.js'
import type { Despesa } from '../../../finances/domain/entities/Despesa.js'
import { PROMPTS } from '../prompts/index.js'

export interface GenerateReportInput {
  mesRef: string
  // number = pessoa específica | null = aba Familiar (compartilhado) | undefined = todos (global)
  pessoaId?: number | null
}

export interface RelatorioIA {
  titulo: string
  resumo: string
  destaques: Array<{ tipo: string; titulo: string; descricao: string }>
  alertas: string[]
  recomendacoes: string[]
  comentario_final: string
}

function prevMesRef(mesRef: string, back: number): string {
  const [y, m] = mesRef.split('-').map(Number)
  const d = new Date(y, m - 1 - back, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

export class GenerateReportUseCase {
  constructor(
    private readonly anthropicRepo: IAnthropicRepository,
    private readonly despesaRepo: IDespesaRepository,
    private readonly rendimentoRepo: IRendimentoRepository,
    private readonly investimentoRepo: IInvestimentoRepository,
    private readonly abaRepo: IAbaRepository,
    private readonly pessoaRepo: IPessoaRepository,
    private readonly cartaoRepo: ICartaoRepository,
    private readonly faturaRepo: IFaturaRepository,
  ) {}

  async execute(input: GenerateReportInput): Promise<RelatorioIA> {
    if (!/^\d{4}-\d{2}$/.test(input.mesRef)) {
      throw HttpError.badRequest('mesRef deve ser YYYY-MM')
    }

    const scope = input.pessoaId // number | null | undefined
    const meses = [prevMesRef(input.mesRef, 2), prevMesRef(input.mesRef, 1), input.mesRef]

    const [abas, pessoas, investimentos, cartoes, despPorMes, rendPorMes] = await Promise.all([
      this.abaRepo.findAll(),
      this.pessoaRepo.findAll(),
      this.investimentoRepo.findMany({ ativo: true }),
      this.cartaoRepo.findAll(),
      Promise.all(meses.map((m) => this.despesaRepo.findMany({ mesRef: m }))),
      Promise.all(meses.map((m) => this.rendimentoRepo.findMany({ mesRef: m }))),
    ])

    const pessoa = typeof scope === 'number' ? pessoas.find((p) => p.id === scope) ?? null : null
    if (typeof scope === 'number' && !pessoa) {
      throw HttpError.badRequest(`Pessoa ${scope} não encontrada`)
    }
    const ownAbaIds = typeof scope === 'number'
      ? new Set(abas.filter((a) => a.pessoaId === scope).map((a) => a.id))
      : new Set<number>()

    // Valor efetivo da pessoa: se há split dela, usa o ratio; senão valor cheio (despesa própria).
    const efetivo = (d: Despesa): number => {
      if (typeof scope === 'number') {
        const meu = d.splits?.find((s) => s.pessoaId === scope)
        if (meu) return d.valor * meu.ratio
      }
      return d.valor
    }

    // Agrega um mês já no escopo (espelha o dashboard). Inclui faturas de cartão (cartao_ciclo)
    // com dedup por (cartaoId, mesRef) mantendo a de maior valor; exclui split_auto.
    const aggMes = (despesas: Despesa[], rendimentos: { pessoaId: number | null; valor: number }[]) => {
      const cicloDedup = new Map<string, Despesa>()
      for (const d of despesas) {
        if (d.tipo !== 'cartao_ciclo') continue
        const key = `${d.cartaoId ?? 0}-${d.mesRef}`
        const prev = cicloDedup.get(key)
        if (!prev || d.valor > prev.valor) cicloDedup.set(key, d)
      }
      const base = [
        ...despesas.filter((d) => d.tipo !== 'split_auto' && d.tipo !== 'cartao_ciclo'),
        ...Array.from(cicloDedup.values()),
      ]

      let despesasFiltradas: Despesa[]
      if (typeof scope === 'number') {
        despesasFiltradas = base.filter((d) =>
          ownAbaIds.has(d.abaId) || (d.splits?.some((s) => s.pessoaId === scope) ?? false),
        )
      } else if (scope === null) {
        despesasFiltradas = base.filter((d) => (d.splits?.length ?? 0) > 0)
      } else {
        despesasFiltradas = base
      }

      const rendFiltrados = typeof scope === 'number'
        ? rendimentos.filter((r) => r.pessoaId === scope)
        : scope === null
          ? rendimentos.filter((r) => r.pessoaId === null)
          : rendimentos

      const totalDespesas = despesasFiltradas.reduce((s, d) => s + efetivo(d), 0)
      const totalRendimentos = rendFiltrados.reduce((s, r) => s + r.valor, 0)
      const saldo = totalRendimentos - totalDespesas
      const taxaPoupancaPct = totalRendimentos > 0 ? round2((saldo / totalRendimentos) * 100) : null
      return { despesasFiltradas, rendFiltrados, totalDespesas, totalRendimentos, saldo, taxaPoupancaPct }
    }

    // Série dos últimos 3 meses (tendência)
    const serie = meses.map((m, i) => {
      const a = aggMes(despPorMes[i], rendPorMes[i])
      return {
        mesRef: m,
        despesas: round2(a.totalDespesas),
        rendimentos: round2(a.totalRendimentos),
        saldo: round2(a.saldo),
        taxaPoupancaPct: a.taxaPoupancaPct,
      }
    })

    // Mês corrente = último da série (detalhamento)
    const atual = aggMes(despPorMes[2], rendPorMes[2])

    const invFiltrados = typeof scope === 'number'
      ? investimentos.filter((i) => i.pessoaId === scope)
      : scope === null
        ? investimentos.filter((i) => i.pessoaId === null)
        : investimentos
    const totalInvestido = invFiltrados.reduce((s, i) => s + i.saldo_atual, 0)

    const porCategoria = atual.despesasFiltradas.reduce<Record<string, number>>((acc, d) => {
      acc[d.categoria] = (acc[d.categoria] ?? 0) + efetivo(d)
      return acc
    }, {})

    // Cartões do escopo + análise da fatura do mês (agregada por categoria — sem transações cruas)
    const abaPessoaIdById = new Map(abas.map((a) => [a.id, a.pessoaId]))
    const cartoesEscopo = cartoes.filter((c) => {
      if (c.abaId == null) return false
      const donoAba = abaPessoaIdById.get(c.abaId) ?? null
      if (typeof scope === 'number') return donoAba === scope
      if (scope === null) return donoAba === null
      return true
    })

    const cartoesAnalise = (
      await Promise.all(
        cartoesEscopo.map(async (c) => {
          const fatura = await this.faturaRepo.findByCartaoAndMesRef(c.id, input.mesRef)
          if (!fatura) return null
          let resumoCategorias: Array<{ categoria: string; valor: number; percentual: number }> = []
          try {
            const parsed = JSON.parse(fatura.analiseJson) as {
              resumo_categorias?: Array<{ categoria: string; valor: number; percentual: number }>
            }
            resumoCategorias = (parsed.resumo_categorias ?? [])
              .slice()
              .sort((a, b) => b.valor - a.valor)
              .slice(0, 5)
              .map((r) => ({ categoria: r.categoria, valor: round2(r.valor), percentual: round2(r.percentual) }))
          } catch { /* analiseJson inválido — ignora breakdown */ }
          const total = fatura.total ?? 0
          const limite = c.limite ?? fatura.limite ?? null
          return {
            cartao: c.nome,
            banco: fatura.banco,
            total: round2(total),
            limite: limite != null ? round2(limite) : null,
            utilizacaoPct: limite && limite > 0 ? round2((total / limite) * 100) : null,
            vencimento: fatura.vencimento,
            resumoCategorias,
          }
        }),
      )
    ).filter((c): c is NonNullable<typeof c> => c != null)

    const escopo = pessoa ? pessoa.nome : scope === null ? 'Familiar (compartilhado)' : 'Todos'

    const contexto = {
      mesRef: input.mesRef,
      escopo,
      // Mês corrente
      totalDespesas: round2(atual.totalDespesas),
      totalRendimentos: round2(atual.totalRendimentos),
      saldo: round2(atual.saldo),
      taxaPoupancaPct: atual.taxaPoupancaPct,
      totalInvestido: round2(totalInvestido),
      despesasPorCategoria: Object.entries(porCategoria)
        .sort((a, b) => b[1] - a[1])
        .map(([cat, val]) => ({ categoria: cat, valor: round2(val) })),
      qtdDespesas: atual.despesasFiltradas.length,
      qtdRendimentos: atual.rendFiltrados.length,
      // Tendência (3 meses, do mais antigo ao corrente)
      ultimos3Meses: serie,
      // Análise da fatura de cartão do mês
      cartoes: cartoesAnalise,
    }

    const systemPrompt = PROMPTS.generateReport()

    const raw = await this.anthropicRepo.call({
      systemPrompt,
      messages: [
        {
          role: 'user',
          content: `Gere o relatório financeiro de "${escopo}" para o mês ${input.mesRef} com base nos seguintes dados:\n\n${JSON.stringify(contexto, null, 2)}`,
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
