import { HttpError } from '../../../../shared/errors.js'
import type { IAcertoRepository } from '../../domain/repositories/IAcertoRepository.js'
import type { CreateAcertoInput, AcertoEntry } from '../../domain/entities/Acerto.js'

export class RegistrarAcertoUseCase {
  constructor(private readonly repo: IAcertoRepository) {}

  async execute(input: CreateAcertoInput): Promise<AcertoEntry> {
    if (input.valor <= 0) throw new HttpError(400, 'Valor deve ser positivo')
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(input.mesRef)) throw new HttpError(400, 'mesRef inválido')
    if (!/^\d{4}-\d{2}-\d{2}$/.test(input.data)) throw new HttpError(400, 'data inválida')
    const [year, month, day] = input.data.split('-').map(Number)
    const parsed = new Date(Date.UTC(year, month - 1, day))
    if (parsed.getUTCFullYear() !== year || parsed.getUTCMonth() !== month - 1 || parsed.getUTCDate() !== day) throw new HttpError(400, 'data inválida')
    return this.repo.registrar(input)
  }
}
