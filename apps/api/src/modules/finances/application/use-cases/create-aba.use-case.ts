import type { IAbaRepository } from '../../domain/repositories/IAbaRepository.js'
import type { AbaDespesa, CreateAbaInput } from '../../domain/entities/AbaDespesa.js'

export class CreateAbaUseCase {
  constructor(private readonly abaRepo: IAbaRepository) {}

  async execute(input: CreateAbaInput): Promise<AbaDespesa> {
    return this.abaRepo.create(input)
  }
}
