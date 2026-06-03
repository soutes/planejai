import type { IAcertoRepository } from '../../domain/repositories/IAcertoRepository.js'
import type { HistoricoFilter, AcertoEntry } from '../../domain/entities/Acerto.js'

export class ListarHistoricoAcertoUseCase {
  constructor(private readonly repo: IAcertoRepository) {}

  async execute(filter: HistoricoFilter): Promise<AcertoEntry[]> {
    return this.repo.listarHistorico(filter)
  }
}
