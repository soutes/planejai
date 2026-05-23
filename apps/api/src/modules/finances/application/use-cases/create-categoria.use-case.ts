import type { ICategoriaRepository } from '../../domain/repositories/ICategoriaRepository.js'
import type { Categoria, CreateCategoriaInput } from '../../domain/entities/Categoria.js'

export class CreateCategoriaUseCase {
  constructor(private readonly categoriaRepo: ICategoriaRepository) {}

  async execute(input: CreateCategoriaInput): Promise<Categoria> {
    return this.categoriaRepo.create(input)
  }
}
