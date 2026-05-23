import type { IOrcamentoRepository } from '../../domain/repositories/IOrcamentoRepository.js'
import type { Orcamento, ListOrcamentosFilter } from '../../domain/entities/Orcamento.js'

export class ListOrcamentosUseCase {
  constructor(private readonly orcamentoRepo: IOrcamentoRepository) {}

  async execute(filter: ListOrcamentosFilter): Promise<Orcamento[]> {
    return this.orcamentoRepo.findMany(filter)
  }
}
