import type { PrismaClient } from '@prisma/client'
import type { IUnitOfWork, TransactionalRepositories } from '../domain/repositories/IUnitOfWork.js'
import { PrismaFaturaRepository } from './prisma-fatura.repository.js'
import { PrismaCartaoRepository } from './prisma-cartao.repository.js'
import { PrismaAbaRepository } from './prisma-aba.repository.js'
import { PrismaPessoaRepository } from './prisma-pessoa.repository.js'
import { PrismaDespesaRepository } from './prisma-despesa.repository.js'

// Importação de fatura faz várias escritas encadeadas; 5s (default do Prisma) é apertado
// em SQLite com fatura grande.
const TX_TIMEOUT_MS = 30_000
const TX_MAX_WAIT_MS = 10_000

export class PrismaUnitOfWork implements IUnitOfWork {
  constructor(private readonly prisma: PrismaClient) {}

  async run<T>(fn: (repos: TransactionalRepositories) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(
      async (tx) => {
        // O client transacional não expõe $transaction/$connect. Os repos que só usam
        // delegates de model funcionam direto; PrismaDespesaRepository precisa saber
        // que já está numa transação (`true`) para não tentar abrir outra por dentro —
        // era isso que derrubava a importação de fatura de cartão de grupo com
        // `TypeError: this.prisma.$transaction is not a function`.
        const client = tx as unknown as PrismaClient
        return fn({
          faturaRepo: new PrismaFaturaRepository(client),
          cartaoRepo: new PrismaCartaoRepository(client),
          abaRepo: new PrismaAbaRepository(client),
          pessoaRepo: new PrismaPessoaRepository(client),
          despesaRepo: new PrismaDespesaRepository(client, true),
        })
      },
      { timeout: TX_TIMEOUT_MS, maxWait: TX_MAX_WAIT_MS },
    )
  }
}
