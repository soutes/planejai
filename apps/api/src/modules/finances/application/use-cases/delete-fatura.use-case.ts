import { HttpError } from '../../../../shared/errors.js'
import type { IFaturaRepository } from '../../domain/repositories/IFaturaRepository.js'

export class DeleteFaturaUseCase {
  constructor(private readonly repo: IFaturaRepository) {}

  async execute(id: number): Promise<void> {
    const fatura = await this.repo.findById(id)
    if (!fatura) throw HttpError.notFound(`Fatura ${id} não encontrada`)
    await this.repo.delete(id)
  }
}
