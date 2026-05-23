import type { IPessoaRepository } from '../../domain/repositories/IPessoaRepository.js'
import type { Pessoa, CreatePessoaInput } from '../../domain/entities/Pessoa.js'

export class CreatePessoaUseCase {
  constructor(private readonly pessoaRepo: IPessoaRepository) {}

  async execute(input: CreatePessoaInput): Promise<Pessoa> {
    return this.pessoaRepo.create(input)
  }
}
