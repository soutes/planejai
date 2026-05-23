import { HttpError } from '../../../../shared/errors.js'
import type { IRendimentoRepository } from '../../domain/repositories/IRendimentoRepository.js'
import type { Rendimento, CreateRendimentoInput } from '../../domain/entities/Rendimento.js'

function addMonths(mesRef: string, months: number): string {
  const [yearStr, monthStr] = mesRef.split('-')
  const d = new Date(parseInt(yearStr), parseInt(monthStr) - 1 + months)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export class CreateRendimentoUseCase {
  constructor(private readonly rendimentoRepo: IRendimentoRepository) {}

  async execute(input: CreateRendimentoInput): Promise<Rendimento> {
    if (input.valor <= 0) throw HttpError.badRequest('Valor deve ser positivo')
    if (!/^\d{4}-\d{2}$/.test(input.mesRef)) throw HttpError.badRequest('mesRef deve ser YYYY-MM')

    const first = await this.rendimentoRepo.create({
      ...input,
      origemId: null,
    })

    if (input.recorrente && input.totalRepeticoes && input.totalRepeticoes > 1) {
      for (let i = 1; i < input.totalRepeticoes; i++) {
        await this.rendimentoRepo.create({
          ...input,
          mesRef: addMonths(input.mesRef, i),
          origemId: first.id,
        })
      }
    }

    return first
  }
}
