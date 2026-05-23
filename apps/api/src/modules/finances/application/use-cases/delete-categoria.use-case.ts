import { HttpError } from '../../../../shared/errors.js'
import type { ICategoriaRepository } from '../../domain/repositories/ICategoriaRepository.js'

export class DeleteCategoriaUseCase {
  constructor(private readonly categoriaRepo: ICategoriaRepository) {}

  async execute(id: number): Promise<void> {
    const existing = await this.categoriaRepo.findById(id)
    if (!existing) throw new HttpError(404, 'Categoria não encontrada')
    const cat = await this.categoriaRepo.findById(id)
    if (cat?.permanente) throw new HttpError(400, 'Categoria permanente não pode ser excluída')
    await this.categoriaRepo.delete(id)
  }
}
