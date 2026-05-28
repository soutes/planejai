import { HttpError } from '../../../../shared/errors.js'
import type { IInvestimentoRepository } from '../../domain/repositories/IInvestimentoRepository.js'

export class DeactivatePosicaoUseCase {
  constructor(private readonly investimentoRepo: IInvestimentoRepository) {}

  async execute(id: number): Promise<void> {
    const existing = await this.investimentoRepo.findById(id)
    if (!existing) throw new HttpError(404, 'Posição não encontrada')
    await this.investimentoRepo.deactivate(id)
  }
}
