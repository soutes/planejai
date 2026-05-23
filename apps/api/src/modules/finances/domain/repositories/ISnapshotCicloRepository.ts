import type { SnapshotCiclo, CreateSnapshotInput, ListSnapshotsFilter } from '../entities/SnapshotCiclo.js'

export interface ISnapshotCicloRepository {
  findMany(filter: ListSnapshotsFilter): Promise<SnapshotCiclo[]>
  findById(id: number): Promise<SnapshotCiclo | null>
  create(input: CreateSnapshotInput): Promise<SnapshotCiclo>
  delete(id: number): Promise<void>
}
