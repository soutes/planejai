import { HttpError } from '../../../../shared/errors.js'
import type { IRegraFixaRepository } from '../../domain/repositories/IRegraFixaRepository.js'

export class DeleteRegraFixaUseCase {
  constructor(private readonly repo: IRegraFixaRepository) {}

  async execute(id: number): Promise<void> {
    const regra = await this.repo.findById(id)
    if (!regra) throw HttpError.notFound(`Regra fixa ${id} não encontrada`)
    await this.repo.delete(id)
  }
}
