import type { IAbaRepository } from '../../domain/repositories/IAbaRepository.js'
import type { AbaDespesa } from '../../domain/entities/AbaDespesa.js'

export class ListAbasUseCase {
  constructor(private readonly abaRepo: IAbaRepository) {}

  async execute(): Promise<AbaDespesa[]> {
    return this.abaRepo.findAll()
  }
}
