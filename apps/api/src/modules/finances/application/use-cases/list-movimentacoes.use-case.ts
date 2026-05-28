import type { IMovimentacaoInvestimentoRepository } from '../../domain/repositories/IMovimentacaoInvestimentoRepository.js'
import type { MovimentacaoComPosicao, ListMovimentacoesFilter } from '../../domain/entities/MovimentacaoInvestimento.js'

export class ListMovimentacoesUseCase {
  constructor(private readonly movimentacaoRepo: IMovimentacaoInvestimentoRepository) {}

  async execute(filter: ListMovimentacoesFilter): Promise<MovimentacaoComPosicao[]> {
    return this.movimentacaoRepo.findMany(filter)
  }
}
