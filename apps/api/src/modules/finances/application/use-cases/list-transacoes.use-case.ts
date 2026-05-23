import { HttpError } from '../../../../shared/errors.js'
import type { IFaturaRepository } from '../../domain/repositories/IFaturaRepository.js'
import type { Transacao } from '../../domain/entities/Transacao.js'

export class ListTransacoesUseCase {
  constructor(private readonly repo: IFaturaRepository) {}

  async execute(faturaId: number): Promise<Transacao[]> {
    const fatura = await this.repo.findById(faturaId)
    if (!fatura) throw HttpError.notFound(`Fatura ${faturaId} não encontrada`)
    return this.repo.findTransacoes(faturaId)
  }
}
