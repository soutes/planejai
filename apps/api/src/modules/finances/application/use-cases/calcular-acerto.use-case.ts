import { HttpError } from '../../../../shared/errors.js'
import type { IAcertoRepository } from '../../domain/repositories/IAcertoRepository.js'
import type { SaldoPessoa } from '../../domain/entities/Acerto.js'

export class CalcularAcertoUseCase {
  constructor(private readonly repo: IAcertoRepository) {}

  async execute(mesRef: string, incluirAnteriores: boolean, membros?: number[]): Promise<SaldoPessoa[]> {
    if (!/^\d{4}-\d{2}$/.test(mesRef)) throw new HttpError(400, 'mesRef deve ser YYYY-MM')
    return this.repo.calcularSaldo(mesRef, incluirAnteriores, membros)
  }
}
