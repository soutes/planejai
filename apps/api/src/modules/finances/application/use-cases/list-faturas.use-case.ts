import type { IFaturaRepository } from '../../domain/repositories/IFaturaRepository.js'
import type { Fatura, ListFaturasFilter } from '../../domain/entities/Fatura.js'

export class ListFaturasUseCase {
  constructor(private readonly repo: IFaturaRepository) {}

  async execute(filter: ListFaturasFilter): Promise<Fatura[]> {
    return this.repo.findMany(filter)
  }
}
