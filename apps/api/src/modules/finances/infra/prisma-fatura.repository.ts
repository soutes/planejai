import type {
  PrismaClient,
  Fatura as PrismaFatura,
  Transacao as PrismaTransacao,
} from '@prisma/client'
import type { IFaturaRepository } from '../domain/repositories/IFaturaRepository.js'
import type { Fatura, CreateFaturaInput, ListFaturasFilter } from '../domain/entities/Fatura.js'
import type { Transacao, CreateTransacaoInput, UpdateTransacaoInput } from '../domain/entities/Transacao.js'

export class PrismaFaturaRepository implements IFaturaRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findMany(filter: ListFaturasFilter): Promise<Fatura[]> {
    const rows = await this.prisma.fatura.findMany({
      where: { ...(filter.cartaoId !== undefined && { cartaoId: filter.cartaoId }) },
      orderBy: [{ mesReferencia: 'desc' }, { criadoEm: 'desc' }],
    })
    return rows.map(this.toDomain)
  }

  async findById(id: number): Promise<Fatura | null> {
    const row = await this.prisma.fatura.findUnique({ where: { id } })
    return row ? this.toDomain(row) : null
  }

  async findByHash(fileHash: string): Promise<Fatura | null> {
    const row = await this.prisma.fatura.findUnique({ where: { fileHash } })
    return row ? this.toDomain(row) : null
  }

  async create(input: CreateFaturaInput): Promise<Fatura> {
    const row = await this.prisma.fatura.create({
      data: {
        fileHash: input.fileHash,
        arquivoOriginal: input.arquivoOriginal,
        banco: input.banco ?? null,
        mesReferencia: input.mesReferencia ?? null,
        vencimento: input.vencimento ?? null,
        total: input.total ?? null,
        limite: input.limite ?? null,
        comentarioExecutivo: input.comentarioExecutivo ?? null,
        analiseJson: input.analiseJson,
        criadoEm: input.criadoEm,
        cartaoId: input.cartaoId,
      },
    })
    return this.toDomain(row)
  }

  async delete(id: number): Promise<void> {
    await this.prisma.fatura.delete({ where: { id } })
  }

  async findTransacoes(faturaId: number): Promise<Transacao[]> {
    const rows = await this.prisma.transacao.findMany({
      where: { faturaId },
      orderBy: { data: 'asc' },
    })
    return rows.map(this.toTransacaoDomain)
  }

  async createTransacoes(items: CreateTransacaoInput[]): Promise<Transacao[]> {
    const rows = await this.prisma.$transaction(
      items.map(item =>
        this.prisma.transacao.create({
          data: {
            faturaId: item.faturaId,
            data: item.data ?? null,
            descricao: item.descricao ?? null,
            estabelecimento: item.estabelecimento ?? null,
            valor: item.valor ?? null,
            categoria: item.categoria ?? null,
            parcela: item.parcela ?? null,
          },
        }),
      ),
    )
    return rows.map(this.toTransacaoDomain)
  }

  async updateTransacao(id: number, input: UpdateTransacaoInput): Promise<Transacao> {
    const row = await this.prisma.transacao.update({
      where: { id },
      data: { categoria: input.categoria ?? null },
    })
    return this.toTransacaoDomain(row)
  }

  async updateAllByEstabelecimento(estabelecimento: string, categoria: string): Promise<number> {
    const result = await this.prisma.transacao.updateMany({
      where: { OR: [{ estabelecimento }, { descricao: estabelecimento }] },
      data: { categoria },
    })
    return result.count
  }

  private toDomain(row: PrismaFatura): Fatura {
    return {
      id: row.id,
      fileHash: row.fileHash,
      arquivoOriginal: row.arquivoOriginal,
      banco: row.banco,
      mesReferencia: row.mesReferencia,
      vencimento: row.vencimento,
      total: row.total,
      limite: row.limite,
      comentarioExecutivo: row.comentarioExecutivo,
      analiseJson: row.analiseJson,
      criadoEm: row.criadoEm,
      cartaoId: row.cartaoId,
    }
  }

  private toTransacaoDomain(row: PrismaTransacao): Transacao {
    return {
      id: row.id,
      faturaId: row.faturaId,
      data: row.data,
      descricao: row.descricao,
      estabelecimento: row.estabelecimento,
      valor: row.valor,
      categoria: row.categoria,
      parcela: row.parcela,
    }
  }
}
