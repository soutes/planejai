import type { IFaturaRepository } from '../../domain/repositories/IFaturaRepository.js'
import type { ICartaoRepository } from '../../domain/repositories/ICartaoRepository.js'
import type { IDespesaRepository } from '../../domain/repositories/IDespesaRepository.js'
import type { Transacao } from '../../domain/entities/Transacao.js'

// Tenta parsear o analiseJson (pode vir cercado por ```json … ```).
function parseAnalise(raw: string): Record<string, unknown> | null {
  try {
    const cleaned =
      raw
        .replace(/^[\s\S]*?```(?:json)?\s*/i, '')
        .replace(/```[\s\S]*$/, '')
        .trim() || raw.trim()
    return JSON.parse(cleaned) as Record<string, unknown>
  } catch {
    return null
  }
}

// Reconstrói resumo_categorias a partir das transações vivas.
function buildResumoCategorias(transacoes: Transacao[]) {
  const agg: Record<string, { valor: number; qtd: number }> = {}
  for (const t of transacoes) {
    const cat = t.categoria ?? 'Outros'
    if (!agg[cat]) agg[cat] = { valor: 0, qtd: 0 }
    agg[cat].valor += t.valor ?? 0
    agg[cat].qtd += 1
  }
  const totalVal = Object.values(agg).reduce((s, v) => s + v.valor, 0)
  return Object.entries(agg)
    .sort(([, a], [, b]) => b.valor - a.valor)
    .map(([categoria, v]) => ({
      categoria,
      valor: v.valor,
      percentual: totalVal > 0 ? (v.valor / totalVal) * 100 : 0,
      qtd_transacoes: v.qtd,
    }))
}

/**
 * Após editar/excluir transações de uma fatura, recalcula o total e propaga a
 * mudança para todos os visuais que dependem dela:
 *  - Fatura.total (Acompanhamento, Histórico, Tendências)
 *  - Fatura.analiseJson (transacoes + resumo_categorias + fatura.total)
 *  - Despesa cartao_ciclo gerada automaticamente (Dashboard, Despesas, Gestão) + splits
 */
export async function resyncFaturaTotais(
  faturaRepo: IFaturaRepository,
  cartaoRepo: ICartaoRepository,
  despesaRepo: IDespesaRepository,
  faturaId: number,
): Promise<void> {
  const fatura = await faturaRepo.findById(faturaId)
  if (!fatura) return

  const transacoes = await faturaRepo.findTransacoes(faturaId)
  const novoTotal = transacoes.reduce((s, t) => s + (t.valor ?? 0), 0)

  await faturaRepo.updateTotal(faturaId, novoTotal)

  // Mantém o snapshot JSON em sincronia (usado em Tendências)
  const analise = parseAnalise(fatura.analiseJson)
  if (analise) {
    analise.transacoes = transacoes.map((t) => ({
      data: t.data,
      descricao: t.descricao,
      estabelecimento: t.estabelecimento,
      valor: t.valor,
      categoria: t.categoria,
      parcela: t.parcela,
    }))
    analise.resumo_categorias = buildResumoCategorias(transacoes)
    if (analise.fatura && typeof analise.fatura === 'object') {
      ;(analise.fatura as Record<string, unknown>).total = novoTotal
    }
    await faturaRepo.updateAnaliseJson(faturaId, JSON.stringify(analise))
  }

  // Sincroniza a despesa cartao_ciclo gerada a partir desta fatura
  const cartao = await cartaoRepo.findById(fatura.cartaoId)
  if (!cartao?.abaId) return

  const mesRef = (fatura.vencimento ?? fatura.mesReferencia)?.slice(0, 7)
  if (!mesRef) return

  const despesa = await despesaRepo.findByCartaoCiclo(cartao.id, mesRef)
  if (!despesa) return

  await despesaRepo.update(despesa.id, { valor: novoTotal })

  const splits = await despesaRepo.findSplits(despesa.id)
  if (splits.length > 0) {
    const ratio = 1 / splits.length
    await despesaRepo.setSplits(
      despesa.id,
      splits.map((s) => ({ pessoaId: s.pessoaId, ratio, valorCalculado: novoTotal * ratio })),
    )
  }
}
