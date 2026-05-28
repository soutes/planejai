import { HttpError } from '../../../../shared/errors.js'
import type { IMovimentacaoInvestimentoRepository } from '../../domain/repositories/IMovimentacaoInvestimentoRepository.js'
import type { MovimentacaoInvestimento, UpdateMovimentacaoInput } from '../../domain/entities/MovimentacaoInvestimento.js'
import { TIPOS_MOVIMENTACAO } from '../../domain/entities/MovimentacaoInvestimento.js'

export class UpdateMovimentacaoUseCase {
  constructor(private readonly movimentacaoRepo: IMovimentacaoInvestimentoRepository) {}

  async execute(id: number, input: UpdateMovimentacaoInput): Promise<MovimentacaoInvestimento> {
    const existing = await this.movimentacaoRepo.findById(id)
    if (!existing) throw new HttpError(404, 'Movimentação não encontrada')

    if (input.valor !== undefined && input.valor <= 0) {
      throw new HttpError(400, 'Valor deve ser maior que zero')
    }
    if (input.mesRef !== undefined && !/^\d{4}-\d{2}$/.test(input.mesRef)) {
      throw new HttpError(400, 'mesRef deve ser YYYY-MM')
    }
    if (input.tipo !== undefined && !TIPOS_MOVIMENTACAO.includes(input.tipo)) {
      throw new HttpError(400, `Tipo inválido. Valores aceitos: ${TIPOS_MOVIMENTACAO.join(', ')}`)
    }

    return this.movimentacaoRepo.update(id, input)
  }
}
