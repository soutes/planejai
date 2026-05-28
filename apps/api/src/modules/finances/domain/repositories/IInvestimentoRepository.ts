import type {
  Investimento,
  PosicaoComMetricas,
  CreateInvestimentoInput,
  UpdateInvestimentoInput,
  ListPosicoesFilter,
} from '../entities/Investimento.js'

export interface IInvestimentoRepository {
  findMany(filter: ListPosicoesFilter): Promise<PosicaoComMetricas[]>
  findById(id: number): Promise<Investimento | null>
  create(input: CreateInvestimentoInput): Promise<Investimento>
  update(id: number, input: UpdateInvestimentoInput): Promise<Investimento>
  deactivate(id: number): Promise<void>
}
