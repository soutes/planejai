import type { IFaturaRepository } from '../../domain/repositories/IFaturaRepository.js'
import type { ICartaoRepository } from '../../domain/repositories/ICartaoRepository.js'

// Uma linha por transação de fatura, com o contexto da fatura/cartão repetido —
// formato ideal para análise (tabela dinâmica) em Excel / Google Sheets.
export interface FaturaExportRow {
  idFatura: number
  descricaoFatura: string  // "Ciclo aberto (Jun/2026)" ou "Fatura Mai/2026"
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

export interface ExportFaturasFilter {
  cartaoId?: number
  faturaId?: number
}

const MESES_PT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

function labelFatura(mesReferencia: string | null, isOpen: boolean): string {
  if (!mesReferencia) return isOpen ? 'Ciclo aberto' : 'Fatura'
  const [year, month] = mesReferencia.split('-')
  const mes = MESES_PT[parseInt(month, 10) - 1] ?? month
  return isOpen ? `Ciclo aberto (${mes}/${year})` : `Fatura ${mes}/${year}`
}

export class ExportFaturasUseCase {
  constructor(
    private readonly faturaRepo: IFaturaRepository,
    private readonly cartaoRepo: ICartaoRepository,
  ) {}

  async execute(filter: ExportFaturasFilter = {}): Promise<FaturaExportRow[]> {
    const cartoes = await this.cartaoRepo.findAll()
    const cartaoNome = new Map(cartoes.map((c) => [c.id, c.nome]))

    let faturas
    if (filter.faturaId != null) {
      const f = await this.faturaRepo.findById(filter.faturaId)
      faturas = f ? [f] : []
    } else {
      faturas = await this.faturaRepo.findMany(filter.cartaoId != null ? { cartaoId: filter.cartaoId } : {})
    }

    // Por cartão, a fatura com maior mesReferencia é o ciclo aberto
    const maxMesByCartao = new Map<number, string>()
    for (const f of faturas) {
      const cur = maxMesByCartao.get(f.cartaoId) ?? ''
      if ((f.mesReferencia ?? '') > cur) maxMesByCartao.set(f.cartaoId, f.mesReferencia ?? '')
    }

    const porFatura = await Promise.all(
      faturas.map(async (f) => {
        const isOpen = (f.mesReferencia ?? '') === (maxMesByCartao.get(f.cartaoId) ?? '')
        const descricaoFatura = labelFatura(f.mesReferencia, isOpen)
        const txs = await this.faturaRepo.findTransacoes(f.id)
        return txs.map<FaturaExportRow>((t) => ({
          idFatura: f.id,
          descricaoFatura,
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
