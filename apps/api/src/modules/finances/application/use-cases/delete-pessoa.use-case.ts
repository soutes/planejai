import { HttpError } from '../../../../shared/errors.js'
import type { IPessoaRepository } from '../../domain/repositories/IPessoaRepository.js'
import type { IDespesaRepository } from '../../domain/repositories/IDespesaRepository.js'

export class DeletePessoaUseCase {
  constructor(
    private readonly pessoaRepo: IPessoaRepository,
    private readonly despesaRepo: IDespesaRepository,
  ) {}

  async execute(id: number): Promise<void> {
    const existing = await this.pessoaRepo.findById(id)
    if (!existing) throw new HttpError(404, 'Pessoa não encontrada')
    // Redistribui splits familiares antes de remover (cascade ja apaga aba propria + despesas dela)
    await this.despesaRepo.redistributeSplitsOnPessoaRemoval(id)
    await this.pessoaRepo.delete(id)
  }
}
