import type { PrismaClient, CategoryRule as PrismaCategoryRule } from '@prisma/client'
import type { ICategoryRuleRepository } from '../domain/repositories/ICategoryRuleRepository.js'
import type { CategoryRule, CreateCategoryRuleInput, UpdateCategoryRuleInput } from '../domain/entities/CategoryRule.js'

export class PrismaCategoryRuleRepository implements ICategoryRuleRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findAll(): Promise<CategoryRule[]> {
    const rows = await this.prisma.categoryRule.findMany({ orderBy: { pattern: 'asc' } })
    return rows.map(this.toDomain)
  }

  async findById(id: number): Promise<CategoryRule | null> {
    const row = await this.prisma.categoryRule.findUnique({ where: { id } })
    return row ? this.toDomain(row) : null
  }

  async create(input: CreateCategoryRuleInput): Promise<CategoryRule> {
    const row = await this.prisma.categoryRule.create({
      data: {
        pattern: input.pattern,
        categoria: input.categoria,
        createdAt: new Date().toISOString(),
      },
    })
    return this.toDomain(row)
  }

  async update(id: number, input: UpdateCategoryRuleInput): Promise<CategoryRule> {
    const row = await this.prisma.categoryRule.update({ where: { id }, data: input })
    return this.toDomain(row)
  }

  async delete(id: number): Promise<void> {
    await this.prisma.categoryRule.delete({ where: { id } })
  }

  async upsertByPattern(pattern: string, categoria: string): Promise<CategoryRule> {
    const row = await this.prisma.categoryRule.upsert({
      where: { pattern },
      update: { categoria },
      create: { pattern, categoria, createdAt: new Date().toISOString() },
    })
    return this.toDomain(row)
  }

  private toDomain(row: PrismaCategoryRule): CategoryRule {
    return {
      id: row.id,
      pattern: row.pattern,
      categoria: row.categoria,
      createdAt: row.createdAt,
    }
  }
}
