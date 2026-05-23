import { HttpError } from '../../../../shared/errors.js'
import type { IDivisaoEntryRepository } from '../../domain/repositories/IDivisaoEntryRepository.js'
import type { DivisaoEntry } from '../../domain/entities/DivisaoEntry.js'

export class QuitarDivisaoUseCase {
  constructor(private readonly repo: IDivisaoEntryRepository) {}

  async execute(id: number): Promise<DivisaoEntry> {
    const entry = await this.repo.findById(id)
    if (!entry) throw HttpError.notFound(`Divisão ${id} não encontrada`)
    if (entry.quitado) throw HttpError.conflict('Divisão já está quitada')
    return this.repo.quitar(id)
  }
}
