import type { ICartaoRepository } from '../../domain/repositories/ICartaoRepository.js'
import type { Cartao, CreateCartaoInput } from '../../domain/entities/Cartao.js'

export class CreateCartaoUseCase {
  constructor(private readonly cartaoRepo: ICartaoRepository) {}

  async execute(input: CreateCartaoInput): Promise<Cartao> {
    return this.cartaoRepo.create(input)
  }
}
