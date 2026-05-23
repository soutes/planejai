import { HttpError } from '../../../../shared/errors.js'
import type { IInvestimentoRepository } from '../../domain/repositories/IInvestimentoRepository.js'
import type { Investimento, UpsertInvestimentoInput } from '../../domain/entities/Investimento.js'

export class UpsertInvestimentoUseCase {
  constructor(private readonly investimentoRepo: IInvestimentoRepository) {}

  async execute(input: UpsertInvestimentoInput): Promise<Investimento> {
    if (input.valor < 0) throw new HttpError(400, 'Valor não pode ser negativo')
    if (!/^\d{4}-\d{2}$/.test(input.mesRef)) throw new HttpError(400, 'mesRef deve ser YYYY-MM')
    return this.investimentoRepo.upsert(input)
  }
}
