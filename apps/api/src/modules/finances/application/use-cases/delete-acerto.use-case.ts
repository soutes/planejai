import type { IAcertoRepository } from '../../domain/repositories/IAcertoRepository.js'

export class DeleteAcertoUseCase {
  constructor(private readonly repo: IAcertoRepository) {}

  async execute(id: number): Promise<void> {
    await this.repo.deletar(id)
  }
}
