import { HttpError } from '../../../../shared/errors.js'
import type { IFaturaRepository } from '../../domain/repositories/IFaturaRepository.js'
import type { Fatura } from '../../domain/entities/Fatura.js'

export class GetFaturaUseCase {
  constructor(private readonly repo: IFaturaRepository) {}

  async execute(id: number): Promise<Fatura> {
    const fatura = await this.repo.findById(id)
    if (!fatura) throw HttpError.notFound(`Fatura ${id} não encontrada`)
    return fatura
  }
}
