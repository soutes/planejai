import type {
  SaldoPessoa,
  AcertoEntry,
  CreateAcertoInput,
  HistoricoFilter,
} from '../entities/Acerto.js'

export interface IAcertoRepository {
  // membros: ids das pessoas de um grupo. Quando informado, restringe o cálculo
  // às despesas cujos splits estão todos dentro do grupo (isola o saldo por grupo).
  calcularSaldo(mesRef: string, incluirAnteriores: boolean, membros?: number[]): Promise<SaldoPessoa[]>
  registrar(input: CreateAcertoInput): Promise<AcertoEntry>
  deletar(id: number): Promise<void>
  listarHistorico(filter: HistoricoFilter): Promise<AcertoEntry[]>
  // true se algum DespesaSplit da despesa está coberto por um acerto
  despesaTemAcerto(despesaId: number): Promise<boolean>
}
