import type { ICartaoRepository } from '../../domain/repositories/ICartaoRepository.js'
import type { Cartao } from '../../domain/entities/Cartao.js'

export class ListCartoesUseCase {
  constructor(private readonly cartaoRepo: ICartaoRepository) {}

  async execute(): Promise<Cartao[]> {
    return this.cartaoRepo.findAll()
  }
}
