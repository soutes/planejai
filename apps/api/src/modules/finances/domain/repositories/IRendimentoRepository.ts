import type { Rendimento, CreateRendimentoInput, UpdateRendimentoInput, ListRendimentosFilter } from '../entities/Rendimento.js'

export interface IRendimentoRepository {
  findMany(filter: ListRendimentosFilter): Promise<Rendimento[]>
  findById(id: number): Promise<Rendimento | null>
  create(input: CreateRendimentoInput): Promise<Rendimento>
  update(id: number, input: UpdateRendimentoInput): Promise<Rendimento>
  delete(id: number): Promise<void>
  deleteMany(origemId: number): Promise<void>
}
