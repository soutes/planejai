import type { Orcamento, UpsertOrcamentoInput, ListOrcamentosFilter } from '../entities/Orcamento.js'

export interface IOrcamentoRepository {
  findMany(filter: ListOrcamentosFilter): Promise<Orcamento[]>
  upsert(input: UpsertOrcamentoInput): Promise<Orcamento>
  delete(id: number): Promise<void>
}
