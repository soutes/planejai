import { HttpError } from '../../../../shared/errors.js'
import type { IDespesaRepository } from '../../domain/repositories/IDespesaRepository.js'
import type { IAbaRepository } from '../../domain/repositories/IAbaRepository.js'
import type { IFormaPagamentoRepository } from '../../domain/repositories/IFormaPagamentoRepository.js'
import type { Despesa, CreateDespesaInput } from '../../domain/entities/Despesa.js'
import type { CreateDespesaSplitInput } from '../../domain/entities/DespesaSplit.js'

function addMonths(mesRef: string, months: number): string {
  const [y, m] = mesRef.split('-').map(Number)
  const d = new Date(y, m - 1 + months)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

// O cliente manda apenas a proporção. `valorCalculado` é derivado aqui a partir do
// valor da despesa (ou da parcela) — quem edita a tela não é dono desse número.
export interface CreateDespesaCommand {
  despesa: CreateDespesaInput
  splits?: Array<{ pessoaId: number; ratio: number }>
}

export class CreateDespesaUseCase {
  constructor(
    private readonly despesaRepo: IDespesaRepository,
    private readonly abaRepo: IAbaRepository,
    private readonly formaPagamentoRepo: IFormaPagamentoRepository,
  ) {}

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

    if (cmd.despesa.formaPagamentoId != null) {
      const aba = await this.abaRepo.findById(cmd.despesa.abaId)
      const forma = await this.formaPagamentoRepo.findById(cmd.despesa.formaPagamentoId)
      if (!forma) {
        throw new HttpError(400, 'Forma de pagamento não encontrada')
      }
      if (aba?.pessoaId != null && forma.pessoaId !== aba.pessoaId) {
        throw new HttpError(400, 'Forma de pagamento não pertence a esta pessoa')
      }
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

    // Arredondar cada parcela pra 2 casas faz a soma não fechar com a compra
    // (100 em 3x = 33,33 × 3 = 99,99). A última parcela absorve a diferença.
    const valoresParcelas = ((): number[] => {
      if (!isParcela) return [cmd.despesa.valor]
      const base = Math.round((cmd.despesa.valor / totalParcelas) * 100) / 100
      const valores = Array<number>(totalParcelas).fill(base)
      const somaAnteriores = Math.round(base * (totalParcelas - 1) * 100) / 100
      valores[totalParcelas - 1] = Math.round((cmd.despesa.valor - somaAnteriores) * 100) / 100
      return valores
    })()

    // Splits acompanham o valor da parcela em que estão. `setSplits` ajusta o
    // resíduo de arredondamento no último para a soma fechar com o valor da despesa.
    const splitsPara = (valor: number): CreateDespesaSplitInput[] | undefined =>
      cmd.splits?.map((s) => ({
        pessoaId: s.pessoaId,
        ratio: s.ratio,
        valorCalculado: Math.round(valor * s.ratio * 100) / 100,
      }))

    const firstInput: CreateDespesaInput = isParcela
      ? { ...cmd.despesa, valor: valoresParcelas[0], parcelaNum: 1 }
      : cmd.despesa

    const despesa = await this.despesaRepo.create(firstInput)

    if (cmd.splits && cmd.splits.length > 0) {
      // Parcelada: split sobre o valor da 1ª parcela. Demais tipos: valor cheio.
      await this.despesaRepo.setSplits(despesa.id, splitsPara(firstInput.valor)!)
    }

    if (isFixa && cmd.despesa.totalRepeticoes && cmd.despesa.totalRepeticoes > 1) {
      for (let i = 1; i < cmd.despesa.totalRepeticoes; i++) {
        const future = await this.despesaRepo.create({
          ...cmd.despesa,
          mesRef: addMonths(cmd.despesa.mesRef, i),
          origemId: despesa.id,
        })
        if (cmd.splits && cmd.splits.length > 0) {
          // Recorrência repete o valor cheio da despesa — antes daqui as ocorrências
          // futuras herdavam o `valorCalculado` que o cliente tinha mandado, sem recálculo.
          await this.despesaRepo.setSplits(future.id, splitsPara(cmd.despesa.valor)!)
        }
      }
    }

    if (isParcela && totalParcelas > 1) {
      for (let i = 2; i <= totalParcelas; i++) {
        const valor = valoresParcelas[i - 1]
        const futureParcela = await this.despesaRepo.create({
          ...cmd.despesa,
          valor,
          mesRef: addMonths(cmd.despesa.mesRef, i - 1),
          parcelaNum: i,
          origemId: despesa.id,
        })
        const splits = splitsPara(valor)
        if (splits && splits.length > 0) {
          await this.despesaRepo.setSplits(futureParcela.id, splits)
        }
      }
    }

    return despesa
  }
}
