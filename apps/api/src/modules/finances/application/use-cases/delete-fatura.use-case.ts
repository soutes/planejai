import { HttpError } from '../../../../shared/errors.js'
import type { IFaturaRepository } from '../../domain/repositories/IFaturaRepository.js'
import type { IDespesaRepository } from '../../domain/repositories/IDespesaRepository.js'
import type { IAcertoRepository } from '../../domain/repositories/IAcertoRepository.js'

export class DeleteFaturaUseCase {
  constructor(
    private readonly repo: IFaturaRepository,
    private readonly despesaRepo: IDespesaRepository,
    private readonly acertoRepo: IAcertoRepository,
  ) {}

  async execute(id: number): Promise<void> {
    const fatura = await this.repo.findById(id)
    if (!fatura) throw HttpError.notFound(`Fatura ${id} não encontrada`)

    // A fatura gera uma despesa cartao_ciclo (mês do vencimento). Remove junto para não
    // deixar lançamento órfão em Despesas / acertaí.
    const mesRef = fatura.vencimento ? fatura.vencimento.slice(0, 7) : fatura.mesReferencia
    if (mesRef) {
      const despesa = await this.despesaRepo.findByCartaoCiclo(fatura.cartaoId, mesRef)
      if (despesa) {
        const temAcerto = await this.acertoRepo.despesaTemAcerto(despesa.id)
        if (temAcerto) {
          throw new HttpError(
            409,
            'A despesa de cartão gerada por esta fatura possui acertos registrados. Exclua os acertos antes de remover a fatura.',
          )
        }
        await this.despesaRepo.delete(despesa.id)
      }
    }

    await this.repo.delete(id)
  }
}
