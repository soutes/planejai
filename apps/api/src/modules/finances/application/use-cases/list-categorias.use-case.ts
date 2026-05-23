import type { ICategoriaRepository } from '../../domain/repositories/ICategoriaRepository.js'
import type { Categoria } from '../../domain/entities/Categoria.js'

export class ListCategoriasUseCase {
  constructor(private readonly categoriaRepo: ICategoriaRepository) {}

  async execute(): Promise<Categoria[]> {
    return this.categoriaRepo.findAll()
  }
}
