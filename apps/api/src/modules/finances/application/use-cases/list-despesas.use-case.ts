import type { IDespesaRepository } from '../../domain/repositories/IDespesaRepository.js'
import type { Despesa, ListDespesasFilter } from '../../domain/entities/Despesa.js'
import { semSinteticas } from '../../domain/services/escopo-despesas.js'

export class ListDespesasUseCase {
  constructor(private readonly despesaRepo: IDespesaRepository) {}

  // Listagem de CRUD: tira só as sintéticas. Sem dedup de cartao_ciclo de propósito —
  // aqui o usuário precisa ver (e poder apagar) cada linha que existe no banco.
  // Quem soma dinheiro usa despesasReais()/agregarMes() do mesmo módulo.
  async execute(filter: ListDespesasFilter & { incluirSinteticos?: boolean }): Promise<Despesa[]> {
    const rows = await this.despesaRepo.findMany(filter)
    if (filter.incluirSinteticos) return rows
    return semSinteticas(rows)
  }
}
