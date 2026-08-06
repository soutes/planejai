import type { IFaturaRepository } from './IFaturaRepository.js'
import type { ICartaoRepository } from './ICartaoRepository.js'
import type { IAbaRepository } from './IAbaRepository.js'
import type { IPessoaRepository } from './IPessoaRepository.js'
import type { IDespesaRepository } from './IDespesaRepository.js'

// Repositórios religados à mesma transação. Só existem dentro do callback de run().
export interface TransactionalRepositories {
  faturaRepo: IFaturaRepository
  cartaoRepo: ICartaoRepository
  abaRepo: IAbaRepository
  pessoaRepo: IPessoaRepository
  despesaRepo: IDespesaRepository
}

// Agrupa escritas em várias tabelas numa transação só. Erro lançado dentro do
// callback desfaz tudo e propaga — inclusive HttpError.
export interface IUnitOfWork {
  run<T>(fn: (repos: TransactionalRepositories) => Promise<T>): Promise<T>
}
