import type { PrismaClient, Cartao as PrismaCartao } from '@prisma/client'
import type { ICartaoRepository } from '../domain/repositories/ICartaoRepository.js'
import type { Cartao, CreateCartaoInput, UpdateCartaoInput } from '../domain/entities/Cartao.js'

type CartaoWithAba = PrismaCartao & { aba?: { pessoaId: number | null } | null }

export class PrismaCartaoRepository implements ICartaoRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findAll(): Promise<Cartao[]> {
    const rows = await this.prisma.cartao.findMany({
      include: { aba: true },
      orderBy: { nome: 'asc' },
    })
    return rows.map(this.toDomain)
  }

  async findById(id: number): Promise<Cartao | null> {
    const row = await this.prisma.cartao.findUnique({ where: { id }, include: { aba: true } })
    return row ? this.toDomain(row) : null
  }

  async create(input: CreateCartaoInput): Promise<Cartao> {
    const row = await this.prisma.cartao.create({
      data: {
        nome: input.nome,
        proprietario: input.proprietario ?? null,
        finalDigitos: input.finalDigitos ?? null,
        cor: input.cor ?? '#10F5A3',
        limite: input.limite ?? null,
        diaFechamento: input.diaFechamento ?? 5,
        diaVencimento: input.diaVencimento ?? 10,
        abaId: input.abaId ?? null,
      },
    })
    return this.toDomain(row)
  }

  async update(id: number, input: UpdateCartaoInput): Promise<Cartao> {
    const row = await this.prisma.cartao.update({ where: { id }, data: input })
    return this.toDomain(row)
  }

  async delete(id: number): Promise<void> {
    await this.prisma.cartao.update({ where: { id }, data: { ativo: false } })
  }

  private toDomain(row: CartaoWithAba): Cartao {
    return {
      id: row.id,
      nome: row.nome,
      proprietario: row.proprietario,
      finalDigitos: row.finalDigitos,
      cor: row.cor,
      limite: row.limite,
      diaFechamento: row.diaFechamento,
      diaVencimento: row.diaVencimento,
      ativo: row.ativo,
      abaId: row.abaId,
      abaPessoaId: row.aba?.pessoaId ?? null,
    }
  }
}
