import { HttpError } from '../../../../shared/errors.js'
import type { ICategoriaRepository } from '../../domain/repositories/ICategoriaRepository.js'
import type { Categoria, UpdateCategoriaInput } from '../../domain/entities/Categoria.js'

export class UpdateCategoriaUseCase {
  constructor(private readonly categoriaRepo: ICategoriaRepository) {}

  async execute(id: number, input: UpdateCategoriaInput): Promise<Categoria> {
    const existing = await this.categoriaRepo.findById(id)
    if (!existing) throw new HttpError(404, 'Categoria não encontrada')
    return this.categoriaRepo.update(id, input)
  }
}
