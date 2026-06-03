import { HttpError } from '../../../../shared/errors.js'
import type { IAcertoRepository } from '../../domain/repositories/IAcertoRepository.js'
import type { CreateAcertoInput, AcertoEntry } from '../../domain/entities/Acerto.js'

export class RegistrarAcertoUseCase {
  constructor(private readonly repo: IAcertoRepository) {}

  async execute(input: CreateAcertoInput): Promise<AcertoEntry> {
    if (input.valor <= 0) throw new HttpError(400, 'Valor deve ser positivo')
    if (!/^\d{4}-\d{2}$/.test(input.mesRef)) throw new HttpError(400, 'mesRef inválido')
    if (!/^\d{4}-\d{2}-\d{2}$/.test(input.data)) throw new HttpError(400, 'data inválida')
    return this.repo.registrar(input)
  }
}
