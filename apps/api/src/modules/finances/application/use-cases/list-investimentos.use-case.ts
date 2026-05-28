// @deprecated — substituído por list-posicoes.use-case.ts (invest-refactor v2)
// Mantido para compatibilidade — não usar em código novo
import type { IInvestimentoRepository } from '../../domain/repositories/IInvestimentoRepository.js'
import type { PosicaoComMetricas, ListPosicoesFilter } from '../../domain/entities/Investimento.js'

export class ListInvestimentosUseCase {
  constructor(private readonly investimentoRepo: IInvestimentoRepository) {}

  async execute(filter: ListPosicoesFilter): Promise<PosicaoComMetricas[]> {
    return this.investimentoRepo.findMany(filter)
  }
}
