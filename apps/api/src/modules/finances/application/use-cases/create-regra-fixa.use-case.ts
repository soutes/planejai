import { HttpError } from '../../../../shared/errors.js'
import type { IRegraFixaRepository } from '../../domain/repositories/IRegraFixaRepository.js'
import type { RegraFixa, CreateRegraFixaInput } from '../../domain/entities/RegraFixa.js'

export class CreateRegraFixaUseCase {
  constructor(private readonly repo: IRegraFixaRepository) {}

  async execute(input: CreateRegraFixaInput): Promise<RegraFixa> {
    if (input.valor <= 0) throw HttpError.badRequest('Valor deve ser positivo')
    return this.repo.create(input)
  }
}
