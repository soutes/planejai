import { HttpError } from '../../../../shared/errors.js'
import type { IRendimentoRepository } from '../../domain/repositories/IRendimentoRepository.js'
import type { Rendimento, UpdateRendimentoInput } from '../../domain/entities/Rendimento.js'

export class UpdateRendimentoUseCase {
  constructor(private readonly rendimentoRepo: IRendimentoRepository) {}

  async execute(id: number, input: UpdateRendimentoInput): Promise<Rendimento> {
    const existing = await this.rendimentoRepo.findById(id)
    if (!existing) throw new HttpError(404, 'Rendimento não encontrado')
    if (input.valor !== undefined && input.valor <= 0) throw new HttpError(400, 'Valor deve ser positivo')
    return this.rendimentoRepo.update(id, input)
  }
}
