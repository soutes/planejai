import type { IInvestimentoRepository } from '../../domain/repositories/IInvestimentoRepository.js'
import type { Investimento, ListInvestimentosFilter } from '../../domain/entities/Investimento.js'

export class ListInvestimentosUseCase {
  constructor(private readonly investimentoRepo: IInvestimentoRepository) {}

  async execute(filter: ListInvestimentosFilter): Promise<Investimento[]> {
    return this.investimentoRepo.findMany(filter)
  }
}
