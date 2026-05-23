import { HttpError } from '../../../../shared/errors.js'
import type { IRendimentoRepository } from '../../domain/repositories/IRendimentoRepository.js'

export class DeleteRendimentoUseCase {
  constructor(private readonly rendimentoRepo: IRendimentoRepository) {}

  async execute(id: number, serie?: boolean): Promise<void> {
    const existing = await this.rendimentoRepo.findById(id)
    if (!existing) throw new HttpError(404, 'Rendimento não encontrado')
    if (serie && existing.origemId) {
      await this.rendimentoRepo.deleteMany(existing.origemId)
    } else if (serie && !existing.origemId) {
      await this.rendimentoRepo.deleteMany(id)
    } else {
      await this.rendimentoRepo.delete(id)
    }
  }
}
