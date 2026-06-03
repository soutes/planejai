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

    const { splits, ...scalar } = input

    // Mudou a data → mês de referência acompanha (despesa migra para o mês novo)
    if (scalar.data && scalar.mesRef === undefined) {
      scalar.mesRef = scalar.data.slice(0, 7)
    }

    const updated = await this.despesaRepo.update(id, scalar)

    if (splits !== undefined) {
      if (splits.length > 0) {
        const totalRatio = splits.reduce((acc, s) => acc + s.ratio, 0)
        if (Math.abs(totalRatio - 1) > 0.001) {
          throw new HttpError(400, 'Soma dos ratios do split deve ser 1')
        }
        // Valor pode ter mudado → recalcula valorCalculado de cada split
        const recomputed = splits.map((s) => ({
          ...s,
          valorCalculado: Math.round(updated.valor * s.ratio * 100) / 100,
        }))
        await this.despesaRepo.setSplits(id, recomputed)
      } else {
        await this.despesaRepo.setSplits(id, [])
      }
    }

    const fresh = await this.despesaRepo.findById(id)
    return fresh ?? updated
  }
}
