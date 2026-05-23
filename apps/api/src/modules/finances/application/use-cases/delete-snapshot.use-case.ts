import { HttpError } from '../../../../shared/errors.js'
import type { ISnapshotCicloRepository } from '../../domain/repositories/ISnapshotCicloRepository.js'

export class DeleteSnapshotUseCase {
  constructor(private readonly repo: ISnapshotCicloRepository) {}

  async execute(id: number): Promise<void> {
    const snap = await this.repo.findById(id)
    if (!snap) throw HttpError.notFound(`Snapshot ${id} não encontrado`)
    await this.repo.delete(id)
  }
}
