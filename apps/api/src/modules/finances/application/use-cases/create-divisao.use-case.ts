import type { IDivisaoEntryRepository } from '../../domain/repositories/IDivisaoEntryRepository.js'
import type { DivisaoEntry, CreateDivisaoInput } from '../../domain/entities/DivisaoEntry.js'

export class CreateDivisaoUseCase {
  constructor(private readonly repo: IDivisaoEntryRepository) {}

  async execute(input: CreateDivisaoInput): Promise<DivisaoEntry> {
    return this.repo.create(input)
  }
}
