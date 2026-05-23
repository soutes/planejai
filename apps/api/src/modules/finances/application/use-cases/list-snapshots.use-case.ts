import type { ISnapshotCicloRepository } from '../../domain/repositories/ISnapshotCicloRepository.js'
import type { SnapshotCiclo, ListSnapshotsFilter } from '../../domain/entities/SnapshotCiclo.js'

export class ListSnapshotsUseCase {
  constructor(private readonly repo: ISnapshotCicloRepository) {}

  async execute(filter: ListSnapshotsFilter): Promise<SnapshotCiclo[]> {
    return this.repo.findMany(filter)
  }
}
