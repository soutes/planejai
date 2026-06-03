import { HttpError } from '../../../../shared/errors.js'
import type { IFaturaRepository } from '../../domain/repositories/IFaturaRepository.js'
import type { ICartaoRepository } from '../../domain/repositories/ICartaoRepository.js'
import type { IDespesaRepository } from '../../domain/repositories/IDespesaRepository.js'
import { resyncFaturaTotais } from './resync-fatura-totais.js'

export class DeleteTransacaoUseCase {
  constructor(
    private readonly repo: IFaturaRepository,
    private readonly cartaoRepo: ICartaoRepository,
    private readonly despesaRepo: IDespesaRepository,
  ) {}

  async execute(faturaId: number, transacaoId: number): Promise<void> {
    const fatura = await this.repo.findById(faturaId)
    if (!fatura) throw HttpError.notFound(`Fatura ${faturaId} não encontrada`)
    const transacoes = await this.repo.findTransacoes(faturaId)
    const transacao = transacoes.find(t => t.id === transacaoId)
    if (!transacao) throw HttpError.notFound(`Transação ${transacaoId} não encontrada nesta fatura`)

    await this.repo.deleteTransacao(transacaoId)

    // Recalcula total da fatura + despesa cartao_ciclo + splits
    await resyncFaturaTotais(this.repo, this.cartaoRepo, this.despesaRepo, faturaId)
  }
}
