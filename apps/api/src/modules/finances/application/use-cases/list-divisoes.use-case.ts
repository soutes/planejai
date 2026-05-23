import type { IDivisaoEntryRepository } from '../../domain/repositories/IDivisaoEntryRepository.js'
import type { DivisaoEntry, ListDivisoesFilter } from '../../domain/entities/DivisaoEntry.js'

export class ListDivisoesUseCase {
  constructor(private readonly repo: IDivisaoEntryRepository) {}

  async execute(filter: ListDivisoesFilter): Promise<DivisaoEntry[]> {
    return this.repo.findMany(filter)
  }
}
