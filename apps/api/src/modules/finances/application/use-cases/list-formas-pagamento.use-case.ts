import type { IFormaPagamentoRepository } from '../../domain/repositories/IFormaPagamentoRepository.js'
import type { FormaPagamento, ListFormasPagamentoFilter } from '../../domain/entities/FormaPagamento.js'

export class ListFormasPagamentoUseCase {
  constructor(private readonly formaPagamentoRepo: IFormaPagamentoRepository) {}

  async execute(filter: ListFormasPagamentoFilter): Promise<FormaPagamento[]> {
    return this.formaPagamentoRepo.findMany({ ...filter, apenasAtivas: true })
  }
}
