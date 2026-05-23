import { HttpError } from '../../../../shared/errors.js'
import type { IAbaRepository } from '../../domain/repositories/IAbaRepository.js'
import type { AbaDespesa, UpdateAbaInput } from '../../domain/entities/AbaDespesa.js'

export class UpdateAbaUseCase {
  constructor(private readonly abaRepo: IAbaRepository) {}

  async execute(id: number, input: UpdateAbaInput): Promise<AbaDespesa> {
    const existing = await this.abaRepo.findById(id)
    if (!existing) throw new HttpError(404, 'Aba não encontrada')
    return this.abaRepo.update(id, input)
  }
}
