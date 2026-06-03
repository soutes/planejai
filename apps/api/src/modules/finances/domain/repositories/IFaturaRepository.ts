import type { Fatura, CreateFaturaInput, ListFaturasFilter } from '../entities/Fatura.js'
import type { Transacao, CreateTransacaoInput, UpdateTransacaoInput } from '../entities/Transacao.js'

export interface IFaturaRepository {
  findMany(filter: ListFaturasFilter): Promise<Fatura[]>
  findById(id: number): Promise<Fatura | null>
  findByHash(fileHash: string): Promise<Fatura | null>
  findByCartaoAndMesRef(cartaoId: number, mesRef: string): Promise<Fatura | null>
  create(input: CreateFaturaInput): Promise<Fatura>
  updateTotal(id: number, total: number): Promise<void>
  updateAnaliseJson(id: number, analiseJson: string): Promise<void>
  delete(id: number): Promise<void>

  findTransacoes(faturaId: number): Promise<Transacao[]>
  createTransacoes(items: CreateTransacaoInput[]): Promise<Transacao[]>
  updateTransacao(id: number, input: UpdateTransacaoInput): Promise<Transacao>
  deleteTransacao(id: number): Promise<void>
  updateAllByEstabelecimento(estabelecimento: string, categoria: string): Promise<number>
}
