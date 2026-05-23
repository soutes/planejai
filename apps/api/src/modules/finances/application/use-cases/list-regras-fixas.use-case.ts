import type { IRegraFixaRepository } from '../../domain/repositories/IRegraFixaRepository.js'
import type { RegraFixa } from '../../domain/entities/RegraFixa.js'

export class ListRegrasFixasUseCase {
  constructor(private readonly repo: IRegraFixaRepository) {}

  async execute(): Promise<RegraFixa[]> {
    return this.repo.findAll()
  }
}
