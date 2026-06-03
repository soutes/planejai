import type { IDespesaRepository } from '../../domain/repositories/IDespesaRepository.js'
import type { IRendimentoRepository } from '../../domain/repositories/IRendimentoRepository.js'
import type { IInvestimentoRepository } from '../../domain/repositories/IInvestimentoRepository.js'
import type { IMovimentacaoInvestimentoRepository } from '../../domain/repositories/IMovimentacaoInvestimentoRepository.js'
import type { IAbaRepository } from '../../domain/repositories/IAbaRepository.js'
import type { IPessoaRepository } from '../../domain/repositories/IPessoaRepository.js'
import type { ICartaoRepository } from '../../domain/repositories/ICartaoRepository.js'

// Linha plana unificando despesas, rendimentos e movimentações de investimento
// para análise externa (Excel / Google Sheets).
export interface LancamentoExportRow {
  tipo: string        // Despesa | Rendimento | Investimento
  subtipo: string     // despesa.tipo | movimentacao.tipo
  data: string        // YYYY-MM-DD (vazio quando não houver)
  mesRef: string      // YYYY-MM
  categoria: string
  descricao: string
  valor: number       // sempre positivo; direção lida via tipo/subtipo
  grupoConta: string  // aba (despesa) | instituição (investimento)
  pessoa: string
  cartao: string
  recorrente: string  // Sim | Não
  notas: string
}

export class ExportLancamentosUseCase {
  constructor(
    private readonly despesaRepo: IDespesaRepository,
    private readonly rendimentoRepo: IRendimentoRepository,
    private readonly investimentoRepo: IInvestimentoRepository,
    private readonly movimentacaoRepo: IMovimentacaoInvestimentoRepository,
    private readonly abaRepo: IAbaRepository,
    private readonly pessoaRepo: IPessoaRepository,
    private readonly cartaoRepo: ICartaoRepository,
  ) {}

  async execute(): Promise<LancamentoExportRow[]> {
    const [despesas, rendimentos, investimentos, movimentacoes, abas, pessoas, cartoes] = await Promise.all([
      this.despesaRepo.findMany({}),
      this.rendimentoRepo.findMany({}),
      this.investimentoRepo.findMany({}),
      this.movimentacaoRepo.findMany({}),
      this.abaRepo.findAll(),
      this.pessoaRepo.findAll(),
      this.cartaoRepo.findAll(),
    ])

    const abaNome = new Map(abas.map((a) => [a.id, a.nome]))
    const cartaoNome = new Map(cartoes.map((c) => [c.id, c.nome]))
    const pessoaNome = (id: number | null | undefined) =>
      id == null ? 'Familiar' : pessoas.find((p) => p.id === id)?.nome ?? 'Desconhecida'
    // investimentoId → pessoaId (movimentação só traz categoria/instituição da posição)
    const investPessoa = new Map(investimentos.map((i) => [i.id, i.pessoaId]))

    const rows: LancamentoExportRow[] = []

    // Despesas — exclui split_auto (espelho sintético do split familiar, evita dupla contagem)
    for (const d of despesas) {
      if (d.tipo === 'split_auto') continue
      rows.push({
        tipo: 'Despesa',
        subtipo: d.tipo,
        data: d.data ?? '',
        mesRef: d.mesRef,
        categoria: d.categoria,
        descricao: d.descricao,
        valor: d.valor,
        grupoConta: abaNome.get(d.abaId) ?? '',
        pessoa: '',
        cartao: d.cartaoId != null ? cartaoNome.get(d.cartaoId) ?? '' : '',
        recorrente: d.recorrente ? 'Sim' : 'Não',
        notas: d.notas ?? '',
      })
    }

    for (const r of rendimentos) {
      rows.push({
        tipo: 'Rendimento',
        subtipo: '',
        data: '',
        mesRef: r.mesRef,
        categoria: r.categoria,
        descricao: r.descricao,
        valor: r.valor,
        grupoConta: '',
        pessoa: pessoaNome(r.pessoaId),
        cartao: '',
        recorrente: r.recorrente ? 'Sim' : 'Não',
        notas: '',
      })
    }

    for (const m of movimentacoes) {
      rows.push({
        tipo: 'Investimento',
        subtipo: m.tipo,
        data: '',
        mesRef: m.mesRef,
        categoria: m.posicao.categoria,
        descricao: m.posicao.instituicao || m.posicao.categoria,
        valor: m.valor,
        grupoConta: m.posicao.instituicao,
        pessoa: pessoaNome(investPessoa.get(m.investimentoId)),
        cartao: '',
        recorrente: 'Não',
        notas: m.notas ?? '',
      })
    }

    // Mais recente primeiro; desempata por tipo
    rows.sort((a, b) => (b.mesRef.localeCompare(a.mesRef)) || a.tipo.localeCompare(b.tipo))
    return rows
  }
}
