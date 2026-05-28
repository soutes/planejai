import { HttpError } from '../../../../shared/errors.js'
import type { IInvestimentoRepository } from '../../domain/repositories/IInvestimentoRepository.js'
import type { Investimento, UpdateInvestimentoInput } from '../../domain/entities/Investimento.js'

export class UpdatePosicaoUseCase {
  constructor(private readonly investimentoRepo: IInvestimentoRepository) {}

  async execute(id: number, input: UpdateInvestimentoInput): Promise<Investimento> {
    const existing = await this.investimentoRepo.findById(id)
    if (!existing) throw new HttpError(404, 'Posição não encontrada')
    return this.investimentoRepo.update(id, input)
  }
}
