import type { IPessoaRepository } from '../../domain/repositories/IPessoaRepository.js'
import type { Pessoa } from '../../domain/entities/Pessoa.js'

export class ListPessoasUseCase {
  constructor(private readonly pessoaRepo: IPessoaRepository) {}

  async execute(): Promise<Pessoa[]> {
    return this.pessoaRepo.findAll()
  }
}
