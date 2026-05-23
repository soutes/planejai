import { HttpError } from '../../../../shared/errors.js'
import type { ICartaoRepository } from '../../domain/repositories/ICartaoRepository.js'
import type { Cartao, UpdateCartaoInput } from '../../domain/entities/Cartao.js'

export class UpdateCartaoUseCase {
  constructor(private readonly cartaoRepo: ICartaoRepository) {}

  async execute(id: number, input: UpdateCartaoInput): Promise<Cartao> {
    const existing = await this.cartaoRepo.findById(id)
    if (!existing) throw new HttpError(404, 'Cartão não encontrado')
    return this.cartaoRepo.update(id, input)
  }
}
