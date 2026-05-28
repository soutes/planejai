import { HttpError } from '../../../../shared/errors.js'
import type { IMovimentacaoInvestimentoRepository } from '../../domain/repositories/IMovimentacaoInvestimentoRepository.js'
import type { IInvestimentoRepository } from '../../domain/repositories/IInvestimentoRepository.js'
import type { MovimentacaoInvestimento, CreateMovimentacaoInput } from '../../domain/entities/MovimentacaoInvestimento.js'
import { TIPOS_MOVIMENTACAO } from '../../domain/entities/MovimentacaoInvestimento.js'

export class CreateMovimentacaoUseCase {
  constructor(
    private readonly movimentacaoRepo: IMovimentacaoInvestimentoRepository,
    private readonly investimentoRepo: IInvestimentoRepository,
  ) {}

  async execute(input: CreateMovimentacaoInput): Promise<MovimentacaoInvestimento> {
    if (input.valor <= 0) throw new HttpError(400, 'Valor deve ser maior que zero')
    if (!/^\d{4}-\d{2}$/.test(input.mesRef)) throw new HttpError(400, 'mesRef deve ser YYYY-MM')
    if (!TIPOS_MOVIMENTACAO.includes(input.tipo)) {
      throw new HttpError(400, `Tipo inválido. Valores aceitos: ${TIPOS_MOVIMENTACAO.join(', ')}`)
    }

    const posicao = await this.investimentoRepo.findById(input.investimentoId)
    if (!posicao) throw new HttpError(404, 'Posição não encontrada')
    if (!posicao.ativo) throw new HttpError(400, 'Não é possível registrar movimentação em posição inativa')

    return this.movimentacaoRepo.create(input)
  }
}
