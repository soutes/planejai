import type { AbaDespesa, CreateAbaInput, UpdateAbaInput } from '../entities/AbaDespesa.js'

export interface IAbaRepository {
  findAll(): Promise<AbaDespesa[]>
  findById(id: number): Promise<AbaDespesa | null>
  create(input: CreateAbaInput): Promise<AbaDespesa>
  update(id: number, input: UpdateAbaInput): Promise<AbaDespesa>
  delete(id: number): Promise<void>
}
