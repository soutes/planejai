import { HttpError } from '../../../../shared/errors.js'
import type { IPessoaRepository } from '../../domain/repositories/IPessoaRepository.js'
import type { Pessoa, UpdatePessoaInput } from '../../domain/entities/Pessoa.js'

export class UpdatePessoaUseCase {
  constructor(private readonly pessoaRepo: IPessoaRepository) {}

  async execute(id: number, input: UpdatePessoaInput): Promise<Pessoa> {
    const existing = await this.pessoaRepo.findById(id)
    if (!existing) throw new HttpError(404, 'Pessoa não encontrada')
    return this.pessoaRepo.update(id, input)
  }
}
