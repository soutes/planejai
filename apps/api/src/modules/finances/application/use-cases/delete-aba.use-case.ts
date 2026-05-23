import { HttpError } from '../../../../shared/errors.js'
import type { IAbaRepository } from '../../domain/repositories/IAbaRepository.js'

export class DeleteAbaUseCase {
  constructor(private readonly abaRepo: IAbaRepository) {}

  async execute(id: number): Promise<void> {
    const existing = await this.abaRepo.findById(id)
    if (!existing) throw new HttpError(404, 'Aba não encontrada')
    await this.abaRepo.delete(id)
  }
}
