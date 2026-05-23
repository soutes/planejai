import { HttpError } from '../../../../shared/errors.js'
import type { IDespesaRepository } from '../../domain/repositories/IDespesaRepository.js'
import type { Despesa, UpdateDespesaInput } from '../../domain/entities/Despesa.js'

export class UpdateDespesaUseCase {
  constructor(private readonly despesaRepo: IDespesaRepository) {}

  async execute(id: number, input: UpdateDespesaInput): Promise<Despesa> {
    const existing = await this.despesaRepo.findById(id)
    if (!existing) throw new HttpError(404, `Despesa ${id} não encontrada`)

    if (input.valor !== undefined && input.valor <= 0) {
      throw new HttpError(400, 'Valor deve ser positivo')
    }

    return this.despesaRepo.update(id, input)
  }
}
