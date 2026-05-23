import type { IOrcamentoRepository } from '../../domain/repositories/IOrcamentoRepository.js'
import { HttpError } from '../../../../shared/errors.js'

export class DeleteOrcamentoUseCase {
  constructor(private readonly orcamentoRepo: IOrcamentoRepository) {}

  async execute(id: number): Promise<void> {
    try {
      await this.orcamentoRepo.delete(id)
    } catch (err: unknown) {
      const e = err as { code?: string }
      if (e?.code === 'P2025') throw HttpError.notFound('Orçamento não encontrado')
      throw err
    }
  }
}
