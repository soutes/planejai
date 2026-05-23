import { HttpError } from '../../../../shared/errors.js'
import type { IOrcamentoRepository } from '../../domain/repositories/IOrcamentoRepository.js'
import type { Orcamento, UpsertOrcamentoInput } from '../../domain/entities/Orcamento.js'

export class UpsertOrcamentoUseCase {
  constructor(private readonly orcamentoRepo: IOrcamentoRepository) {}

  async execute(input: UpsertOrcamentoInput): Promise<Orcamento> {
    if (input.valorMeta <= 0) throw new HttpError(400, 'valorMeta deve ser positivo')
    if (input.mesRef && !/^\d{4}-\d{2}$/.test(input.mesRef)) {
      throw new HttpError(400, 'mesRef deve ser YYYY-MM')
    }
    return this.orcamentoRepo.upsert(input)
  }
}
