import type {
  Despesa,
  CreateDespesaInput,
  UpdateDespesaInput,
  ListDespesasFilter,
} from '../entities/Despesa.js'
import type { DespesaSplit, CreateDespesaSplitInput } from '../entities/DespesaSplit.js'

export interface IDespesaRepository {
  findMany(filter: ListDespesasFilter): Promise<Despesa[]>
  findById(id: number): Promise<Despesa | null>
  create(input: CreateDespesaInput): Promise<Despesa>
  update(id: number, input: UpdateDespesaInput): Promise<Despesa>
  delete(id: number): Promise<void>
  deleteMany(origemId: number): Promise<void>

  findSplits(despesaId: number): Promise<DespesaSplit[]>
  setSplits(despesaId: number, splits: CreateDespesaSplitInput[]): Promise<DespesaSplit[]>

  // Remove splits da pessoa em todas as despesas e redistribui proporcionalmente aos demais
  redistributeSplitsOnPessoaRemoval(pessoaId: number): Promise<void>
}
