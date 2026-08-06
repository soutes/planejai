import { HttpError } from '../../../../shared/errors.js'
import type { IFormaPagamentoRepository } from '../../domain/repositories/IFormaPagamentoRepository.js'
import type { FormaPagamento, CreateFormaPagamentoInput } from '../../domain/entities/FormaPagamento.js'

export interface UpsertFormaPagamentoResult {
  forma: FormaPagamento
  created: boolean
}

export class UpsertFormaPagamentoUseCase {
  constructor(private readonly formaPagamentoRepo: IFormaPagamentoRepository) {}

  async execute(input: CreateFormaPagamentoInput): Promise<UpsertFormaPagamentoResult> {
    if (!input.nome || input.nome.trim().length === 0) {
      throw HttpError.badRequest('Nome da forma de pagamento não pode ser vazio')
    }
    if (!input.pessoaId || input.pessoaId <= 0) {
      throw HttpError.badRequest('pessoaId inválido')
    }
    return this.formaPagamentoRepo.upsert({ ...input, nome: input.nome.trim() })
  }
}
