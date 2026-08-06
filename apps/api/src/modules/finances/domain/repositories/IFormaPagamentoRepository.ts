import type { FormaPagamento, CreateFormaPagamentoInput, ListFormasPagamentoFilter } from '../entities/FormaPagamento.js'

export interface IFormaPagamentoRepository {
  findMany(filter: ListFormasPagamentoFilter): Promise<FormaPagamento[]>
  findById(id: number): Promise<FormaPagamento | null>
  upsert(input: CreateFormaPagamentoInput): Promise<{ forma: FormaPagamento; created: boolean }>
}
