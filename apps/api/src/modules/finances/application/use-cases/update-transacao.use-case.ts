import { HttpError } from '../../../../shared/errors.js'
import type { IFaturaRepository } from '../../domain/repositories/IFaturaRepository.js'
import type { ICategoryRuleRepository } from '../../domain/repositories/ICategoryRuleRepository.js'
import type { Transacao, UpdateTransacaoInput } from '../../domain/entities/Transacao.js'

export class UpdateTransacaoUseCase {
  constructor(
    private readonly repo: IFaturaRepository,
    private readonly categoryRuleRepo: ICategoryRuleRepository,
  ) {}

  async execute(faturaId: number, transacaoId: number, input: UpdateTransacaoInput): Promise<Transacao> {
    const fatura = await this.repo.findById(faturaId)
    if (!fatura) throw HttpError.notFound(`Fatura ${faturaId} não encontrada`)
    const transacoes = await this.repo.findTransacoes(faturaId)
    const transacao = transacoes.find(t => t.id === transacaoId)
    if (!transacao) throw HttpError.notFound(`Transação ${transacaoId} não encontrada nesta fatura`)

    // Atualiza a transação solicitada
    const updated = await this.repo.updateTransacao(transacaoId, input)

    // Propaga a mudança de categoria para todas as transações do mesmo estabelecimento
    if (input.categoria && transacao.estabelecimento) {
      const estab = transacao.estabelecimento
      // Upsert regra persistente
      await this.categoryRuleRepo.upsertByPattern(estab, input.categoria)
      // Aplica a todas as transações com mesmo estabelecimento (exceto a já atualizada acima)
      await this.repo.updateAllByEstabelecimento(estab, input.categoria)
    }

    return updated
  }
}
