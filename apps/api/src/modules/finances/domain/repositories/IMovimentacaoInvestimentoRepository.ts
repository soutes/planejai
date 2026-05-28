import type {
  MovimentacaoInvestimento,
  MovimentacaoComPosicao,
  EvolucaoMensal,
  CreateMovimentacaoInput,
  UpdateMovimentacaoInput,
  ListMovimentacoesFilter,
} from '../entities/MovimentacaoInvestimento.js'

export interface IMovimentacaoInvestimentoRepository {
  findMany(filter: ListMovimentacoesFilter): Promise<MovimentacaoComPosicao[]>
  findById(id: number): Promise<MovimentacaoInvestimento | null>
  create(input: CreateMovimentacaoInput): Promise<MovimentacaoInvestimento>
  update(id: number, input: UpdateMovimentacaoInput): Promise<MovimentacaoInvestimento>
  delete(id: number): Promise<void>
  getEvolucao(pessoaId: number | null | undefined, meses: number): Promise<EvolucaoMensal[]>
}
