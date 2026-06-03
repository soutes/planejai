import { HttpError } from '../../../../shared/errors.js'
import type { IFaturaRepository } from '../../domain/repositories/IFaturaRepository.js'
import type { ICartaoRepository } from '../../domain/repositories/ICartaoRepository.js'
import type { IDespesaRepository } from '../../domain/repositories/IDespesaRepository.js'
import type { ICategoryRuleRepository } from '../../domain/repositories/ICategoryRuleRepository.js'
import type { Transacao, UpdateTransacaoInput } from '../../domain/entities/Transacao.js'
import { resyncFaturaTotais } from './resync-fatura-totais.js'

export class UpdateTransacaoUseCase {
  constructor(
    private readonly repo: IFaturaRepository,
    private readonly categoryRuleRepo: ICategoryRuleRepository,
    private readonly cartaoRepo: ICartaoRepository,
    private readonly despesaRepo: IDespesaRepository,
  ) {}

  async execute(faturaId: number, transacaoId: number, input: UpdateTransacaoInput): Promise<Transacao> {
    const fatura = await this.repo.findById(faturaId)
    if (!fatura) throw HttpError.notFound(`Fatura ${faturaId} não encontrada`)
    const transacoes = await this.repo.findTransacoes(faturaId)
    const transacao = transacoes.find(t => t.id === transacaoId)
    if (!transacao) throw HttpError.notFound(`Transação ${transacaoId} não encontrada nesta fatura`)

    // Atualiza a transação solicitada (somente campos presentes no input)
    const updated = await this.repo.updateTransacao(transacaoId, input)

    // Propaga categoria para o mesmo estabelecimento APENAS quando o usuário só mudou
    // a categoria (não renomeou o estabelecimento na mesma edição).
    if (input.categoria && input.estabelecimento === undefined && transacao.estabelecimento) {
      const estab = transacao.estabelecimento
      await this.categoryRuleRepo.upsertByPattern(estab, input.categoria)
      await this.repo.updateAllByEstabelecimento(estab, input.categoria)
    }

    // Se o valor mudou, recalcula total da fatura + despesa cartao_ciclo + splits
    if (input.valor !== undefined) {
      await resyncFaturaTotais(this.repo, this.cartaoRepo, this.despesaRepo, faturaId)
    }

    return updated
  }
}
