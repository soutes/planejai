import { HttpError } from '../../../../shared/errors.js'
import type { IDespesaRepository } from '../../domain/repositories/IDespesaRepository.js'

export class DeleteDespesaUseCase {
  constructor(private readonly despesaRepo: IDespesaRepository) {}

  async execute(id: number, serie?: boolean): Promise<void> {
    const existing = await this.despesaRepo.findById(id)
    if (!existing) throw new HttpError(404, `Despesa ${id} não encontrada`)

    if (serie && existing.origemId) {
      await this.despesaRepo.deleteMany(existing.origemId)
    } else if (serie && existing.recorrente) {
      await this.despesaRepo.deleteMany(existing.id)
    } else {
      await this.despesaRepo.delete(id)
    }
  }
}
