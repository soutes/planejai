import { HttpError } from '../../../../shared/errors.js'
import type { IRegraFixaRepository } from '../../domain/repositories/IRegraFixaRepository.js'
import type { RegraFixa, UpdateRegraFixaInput } from '../../domain/entities/RegraFixa.js'

export class UpdateRegraFixaUseCase {
  constructor(private readonly repo: IRegraFixaRepository) {}

  async execute(id: number, input: UpdateRegraFixaInput): Promise<RegraFixa> {
    const regra = await this.repo.findById(id)
    if (!regra) throw HttpError.notFound(`Regra fixa ${id} não encontrada`)
    if (input.valor !== undefined && input.valor <= 0) throw HttpError.badRequest('Valor deve ser positivo')
    return this.repo.update(id, input)
  }
}
