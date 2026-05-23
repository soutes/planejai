import { HttpError } from '../../../../shared/errors.js'
import type { ICartaoRepository } from '../../domain/repositories/ICartaoRepository.js'

export class DeleteCartaoUseCase {
  constructor(private readonly cartaoRepo: ICartaoRepository) {}

  async execute(id: number): Promise<void> {
    if (id === 1) throw HttpError.badRequest('Cartão sentinela não pode ser removido')
    const existing = await this.cartaoRepo.findById(id)
    if (!existing) throw HttpError.notFound('Cartão não encontrado')
    // Soft delete: ativo=false preserva faturas históricas
    await this.cartaoRepo.update(id, { ativo: false })
  }
}
