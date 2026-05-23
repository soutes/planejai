import { HttpError } from '../../../../shared/errors.js'
import type { ISnapshotCicloRepository } from '../../domain/repositories/ISnapshotCicloRepository.js'
import type { SnapshotCiclo, CreateSnapshotInput } from '../../domain/entities/SnapshotCiclo.js'

export class CreateSnapshotUseCase {
  constructor(private readonly repo: ISnapshotCicloRepository) {}

  async execute(input: CreateSnapshotInput): Promise<SnapshotCiclo> {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(input.cicloInicio)) {
      throw HttpError.badRequest('cicloInicio deve ser YYYY-MM-DD')
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(input.cicloFim)) {
      throw HttpError.badRequest('cicloFim deve ser YYYY-MM-DD')
    }
    return this.repo.create(input)
  }
}
