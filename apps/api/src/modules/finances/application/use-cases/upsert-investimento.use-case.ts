// @deprecated — substituído por create-posicao.use-case.ts (invest-refactor v2)
// Mantido para compatibilidade — não usar em código novo
import { HttpError } from '../../../../shared/errors.js'
import type { IInvestimentoRepository } from '../../domain/repositories/IInvestimentoRepository.js'
import type { Investimento, CreateInvestimentoInput } from '../../domain/entities/Investimento.js'

export class UpsertInvestimentoUseCase {
  constructor(private readonly investimentoRepo: IInvestimentoRepository) {}

  async execute(input: CreateInvestimentoInput): Promise<Investimento> {
    if (!input.categoria) throw new HttpError(400, 'Categoria é obrigatória')
    return this.investimentoRepo.create(input)
  }
}
