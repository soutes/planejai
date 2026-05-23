import type { Investimento, UpsertInvestimentoInput, ListInvestimentosFilter } from '../entities/Investimento.js'

export interface IInvestimentoRepository {
  findMany(filter: ListInvestimentosFilter): Promise<Investimento[]>
  findById(id: number): Promise<Investimento | null>
  upsert(input: UpsertInvestimentoInput): Promise<Investimento>
  delete(id: number): Promise<void>
}
