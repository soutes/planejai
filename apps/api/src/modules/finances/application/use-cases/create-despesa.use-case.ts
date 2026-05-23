import { HttpError } from '../../../../shared/errors.js'
import type { IDespesaRepository } from '../../domain/repositories/IDespesaRepository.js'
import type { Despesa, CreateDespesaInput } from '../../domain/entities/Despesa.js'
import type { CreateDespesaSplitInput } from '../../domain/entities/DespesaSplit.js'

export interface CreateDespesaCommand {
  despesa: CreateDespesaInput
  splits?: CreateDespesaSplitInput[]
}

export class CreateDespesaUseCase {
  constructor(private readonly despesaRepo: IDespesaRepository) {}

  async execute(cmd: CreateDespesaCommand): Promise<Despesa> {
    if (cmd.despesa.valor <= 0) {
      throw new HttpError(400, 'Valor deve ser positivo')
    }

    if (!/^\d{4}-\d{2}$/.test(cmd.despesa.mesRef)) {
      throw new HttpError(400, 'mesRef deve estar no formato YYYY-MM')
    }

    if (cmd.despesa.data && !/^\d{4}-\d{2}-\d{2}$/.test(cmd.despesa.data)) {
      throw new HttpError(400, 'data deve estar no formato YYYY-MM-DD')
    }

    if (cmd.splits && cmd.splits.length > 0) {
      const totalRatio = cmd.splits.reduce((acc, s) => acc + s.ratio, 0)
      if (Math.abs(totalRatio - 1) > 0.001) {
        throw new HttpError(400, 'Soma dos ratios do split deve ser 1')
      }
    }

    const despesa = await this.despesaRepo.create(cmd.despesa)

    if (cmd.splits && cmd.splits.length > 0) {
      await this.despesaRepo.setSplits(despesa.id, cmd.splits)
    }

    return despesa
  }
}
