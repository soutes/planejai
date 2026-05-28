import { HttpError } from '../../../../shared/errors.js'
import type { IMovimentacaoInvestimentoRepository } from '../../domain/repositories/IMovimentacaoInvestimentoRepository.js'

export class DeleteMovimentacaoUseCase {
  constructor(private readonly movimentacaoRepo: IMovimentacaoInvestimentoRepository) {}

  async execute(id: number): Promise<void> {
    const existing = await this.movimentacaoRepo.findById(id)
    if (!existing) throw new HttpError(404, 'Movimentação não encontrada')
    await this.movimentacaoRepo.delete(id)
  }
}
