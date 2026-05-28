import { HttpError } from '../../../../shared/errors.js'
import type { IMovimentacaoInvestimentoRepository } from '../../domain/repositories/IMovimentacaoInvestimentoRepository.js'
import type { EvolucaoMensal } from '../../domain/entities/MovimentacaoInvestimento.js'

export class GetEvolucaoUseCase {
  constructor(private readonly movimentacaoRepo: IMovimentacaoInvestimentoRepository) {}

  async execute(meses: number, pessoaId?: number | null): Promise<EvolucaoMensal[]> {
    if (meses < 1 || meses > 60) throw new HttpError(400, 'meses deve estar entre 1 e 60')
    return this.movimentacaoRepo.getEvolucao(pessoaId, meses)
  }
}
