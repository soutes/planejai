import type { IFaturaRepository } from '../../domain/repositories/IFaturaRepository.js'
import type { ICartaoRepository } from '../../domain/repositories/ICartaoRepository.js'

// Uma linha por transação de fatura, com o contexto da fatura/cartão repetido —
// formato ideal para análise (tabela dinâmica) em Excel / Google Sheets.
export interface FaturaExportRow {
  cartao: string
  banco: string
  faturaMes: string    // YYYY-MM
  vencimento: string   // YYYY-MM-DD
  data: string         // YYYY-MM-DD da transação
  descricao: string
  estabelecimento: string
  categoria: string
  parcela: string
  valor: number        // positivo = débito
}

export class ExportFaturasUseCase {
  constructor(
    private readonly faturaRepo: IFaturaRepository,
    private readonly cartaoRepo: ICartaoRepository,
  ) {}

  async execute(): Promise<FaturaExportRow[]> {
    const [faturas, cartoes] = await Promise.all([
      this.faturaRepo.findMany({}),
      this.cartaoRepo.findAll(),
    ])

    const cartaoNome = new Map(cartoes.map((c) => [c.id, c.nome]))

    const porFatura = await Promise.all(
      faturas.map(async (f) => {
        const txs = await this.faturaRepo.findTransacoes(f.id)
        return txs.map<FaturaExportRow>((t) => ({
          cartao: cartaoNome.get(f.cartaoId) ?? '',
          banco: f.banco ?? '',
          faturaMes: f.mesReferencia ?? '',
          vencimento: f.vencimento ?? '',
          data: t.data ?? '',
          descricao: t.descricao ?? '',
          estabelecimento: t.estabelecimento ?? '',
          categoria: t.categoria ?? '',
          parcela: t.parcela ?? '',
          valor: t.valor ?? 0,
        }))
      }),
    )

    const rows = porFatura.flat()
    // Fatura mais recente primeiro; desempata pela data da transação
    rows.sort((a, b) => b.faturaMes.localeCompare(a.faturaMes) || a.data.localeCompare(b.data))
    return rows
  }
}
