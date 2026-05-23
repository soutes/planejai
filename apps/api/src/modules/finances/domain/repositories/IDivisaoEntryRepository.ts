import type { DivisaoEntry, CreateDivisaoInput, ListDivisoesFilter } from '../entities/DivisaoEntry.js'

export interface IDivisaoEntryRepository {
  findMany(filter: ListDivisoesFilter): Promise<DivisaoEntry[]>
  findById(id: number): Promise<DivisaoEntry | null>
  create(input: CreateDivisaoInput): Promise<DivisaoEntry>
  quitar(id: number): Promise<DivisaoEntry>
}
