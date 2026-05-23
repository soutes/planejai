import type { IRendimentoRepository } from '../../domain/repositories/IRendimentoRepository.js'
import type { Rendimento, ListRendimentosFilter } from '../../domain/entities/Rendimento.js'

export class ListRendimentosUseCase {
  constructor(private readonly rendimentoRepo: IRendimentoRepository) {}

  async execute(filter: ListRendimentosFilter): Promise<Rendimento[]> {
    return this.rendimentoRepo.findMany(filter)
  }
}
