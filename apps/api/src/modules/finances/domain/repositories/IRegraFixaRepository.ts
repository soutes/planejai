import type { RegraFixa, CreateRegraFixaInput, UpdateRegraFixaInput } from '../entities/RegraFixa.js'

export interface IRegraFixaRepository {
  findAll(): Promise<RegraFixa[]>
  findById(id: number): Promise<RegraFixa | null>
  create(input: CreateRegraFixaInput): Promise<RegraFixa>
  update(id: number, input: UpdateRegraFixaInput): Promise<RegraFixa>
  delete(id: number): Promise<void>
}
