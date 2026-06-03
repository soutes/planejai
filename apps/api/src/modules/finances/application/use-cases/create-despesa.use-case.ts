import { HttpError } from '../../../../shared/errors.js'
import type { IDespesaRepository } from '../../domain/repositories/IDespesaRepository.js'
import type { Despesa, CreateDespesaInput } from '../../domain/entities/Despesa.js'
import type { CreateDespesaSplitInput } from '../../domain/entities/DespesaSplit.js'

function addMonths(mesRef: string, months: number): string {
  const [y, m] = mesRef.split('-').map(Number)
  const d = new Date(y, m - 1 + months)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

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

    const isParcela = cmd.despesa.tipo === 'parcela'
    const isFixa = cmd.despesa.tipo === 'fixa' || cmd.despesa.recorrente === true

    // Parcelado: divide valor total pelas parcelas
    const totalParcelas = isParcela && cmd.despesa.totalParcelas && cmd.despesa.totalParcelas > 1
      ? cmd.despesa.totalParcelas
      : 1
    const valorParcela = isParcela ? Math.round((cmd.despesa.valor / totalParcelas) * 100) / 100 : cmd.despesa.valor

    // Splits recalculados com valorParcela
    const splitsParcelados = cmd.splits?.map((s) => ({
      ...s,
      valorCalculado: Math.round(valorParcela * s.ratio * 100) / 100,
    }))

    const firstInput: CreateDespesaInput = isParcela
      ? { ...cmd.despesa, valor: valorParcela, parcelaNum: 1 }
      : cmd.despesa

    const despesa = await this.despesaRepo.create(firstInput)

    if (cmd.splits && cmd.splits.length > 0) {
      await this.despesaRepo.setSplits(despesa.id, splitsParcelados ?? cmd.splits)
    }

    if (isFixa && cmd.despesa.totalRepeticoes && cmd.despesa.totalRepeticoes > 1) {
      for (let i = 1; i < cmd.despesa.totalRepeticoes; i++) {
        const future = await this.despesaRepo.create({
          ...cmd.despesa,
          mesRef: addMonths(cmd.despesa.mesRef, i),
          origemId: despesa.id,
        })
        if (cmd.splits && cmd.splits.length > 0) {
          await this.despesaRepo.setSplits(future.id, cmd.splits)
        }
      }
    }

    if (isParcela && totalParcelas > 1) {
      for (let i = 2; i <= totalParcelas; i++) {
        const futureParcela = await this.despesaRepo.create({
          ...cmd.despesa,
          valor: valorParcela,
          mesRef: addMonths(cmd.despesa.mesRef, i - 1),
          parcelaNum: i,
          origemId: despesa.id,
        })
        if (splitsParcelados && splitsParcelados.length > 0) {
          await this.despesaRepo.setSplits(futureParcela.id, splitsParcelados)
        }
      }
    }

    return despesa
  }
}
