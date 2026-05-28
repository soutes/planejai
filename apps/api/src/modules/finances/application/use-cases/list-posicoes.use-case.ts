import type { IInvestimentoRepository } from '../../domain/repositories/IInvestimentoRepository.js'
import type { PosicaoComMetricas, ListPosicoesFilter } from '../../domain/entities/Investimento.js'

export class ListPosicoesUseCase {
  constructor(private readonly investimentoRepo: IInvestimentoRepository) {}

  async execute(filter: ListPosicoesFilter): Promise<PosicaoComMetricas[]> {
    // Default: apenas posições ativas
    const f: ListPosicoesFilter = {
      ...filter,
      ativo: filter.ativo !== undefined ? filter.ativo : true,
    }
    return this.investimentoRepo.findMany(f)
  }
}
