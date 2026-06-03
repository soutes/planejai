import { HttpError } from '../../../../shared/errors.js'
import type { IDespesaRepository } from '../../domain/repositories/IDespesaRepository.js'
import type { IAcertoRepository } from '../../domain/repositories/IAcertoRepository.js'

export class DeleteDespesaUseCase {
  constructor(
    private readonly despesaRepo: IDespesaRepository,
    private readonly acertoRepo: IAcertoRepository,
  ) {}

  async execute(id: number, serie?: boolean): Promise<void> {
    const existing = await this.despesaRepo.findById(id)
    if (!existing) throw new HttpError(404, `Despesa ${id} não encontrada`)

    // Bloqueia exclusão se algum split da despesa estiver coberto por acerto
    const temAcerto = await this.acertoRepo.despesaTemAcerto(id)
    if (temAcerto) {
      throw new HttpError(409, 'Despesa possui splits com acertos registrados. Exclua os acertos primeiro.')
    }

    if (serie && existing.origemId) {
      await this.despesaRepo.deleteMany(existing.origemId)
    } else if (serie && existing.recorrente) {
      await this.despesaRepo.deleteMany(existing.id)
    } else {
      await this.despesaRepo.delete(id)
    }
  }
}
