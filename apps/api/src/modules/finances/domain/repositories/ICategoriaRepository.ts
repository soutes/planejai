import type { Categoria, CreateCategoriaInput, UpdateCategoriaInput } from '../entities/Categoria.js'

export interface ICategoriaRepository {
  findAll(): Promise<Categoria[]>
  findById(id: number): Promise<Categoria | null>
  create(input: CreateCategoriaInput): Promise<Categoria>
  update(id: number, input: UpdateCategoriaInput): Promise<Categoria>
  delete(id: number): Promise<void>
}
