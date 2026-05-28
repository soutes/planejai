import { HttpError } from '../../../../shared/errors.js'
import type { IInvestimentoRepository } from '../../domain/repositories/IInvestimentoRepository.js'
import type { Investimento, CreateInvestimentoInput } from '../../domain/entities/Investimento.js'

const CATEGORIAS_VALIDAS = [
  'Reserva de Emergência', 'Renda Fixa', 'Tesouro Direto',
  'Ações', 'FIIs', 'Previdência Privada', 'Fundos', 'Cripto', 'Internacional',
]

export class CreatePosicaoUseCase {
  constructor(private readonly investimentoRepo: IInvestimentoRepository) {}

  async execute(input: CreateInvestimentoInput): Promise<Investimento> {
    if (!input.categoria || !CATEGORIAS_VALIDAS.includes(input.categoria)) {
      throw new HttpError(400, `Categoria inválida. Valores aceitos: ${CATEGORIAS_VALIDAS.join(', ')}`)
    }
    if (!input.instituicao?.trim()) {
      throw new HttpError(400, 'Instituição é obrigatória')
    }
    return this.investimentoRepo.create(input)
  }
}
