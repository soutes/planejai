import { HttpError } from '../../../../shared/errors.js'
import type { IDespesaRepository } from '../../domain/repositories/IDespesaRepository.js'
import type { DespesaSplit } from '../../domain/entities/DespesaSplit.js'

export class GetDespesaSplitsUseCase {
  constructor(private readonly despesaRepo: IDespesaRepository) {}

  async execute(despesaId: number): Promise<DespesaSplit[]> {
    const despesa = await this.despesaRepo.findById(despesaId)
    if (!despesa) throw new HttpError(404, `Despesa ${despesaId} não encontrada`)
    return this.despesaRepo.findSplits(despesaId)
  }
}
