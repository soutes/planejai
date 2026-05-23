import type { IDespesaRepository } from '../../domain/repositories/IDespesaRepository.js'
import type { Despesa, ListDespesasFilter } from '../../domain/entities/Despesa.js'

const TIPOS_SINTETICOS = new Set(['cartao_ciclo', 'split_auto'])

export class ListDespesasUseCase {
  constructor(private readonly despesaRepo: IDespesaRepository) {}

  async execute(filter: ListDespesasFilter & { incluirSinteticos?: boolean }): Promise<Despesa[]> {
    const rows = await this.despesaRepo.findMany(filter)
    if (filter.incluirSinteticos) return rows
    return rows.filter(d => !TIPOS_SINTETICOS.has(d.tipo))
  }
}
