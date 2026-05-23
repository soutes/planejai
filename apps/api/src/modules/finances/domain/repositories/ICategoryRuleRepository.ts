import type { CategoryRule, CreateCategoryRuleInput, UpdateCategoryRuleInput } from '../entities/CategoryRule.js'

export interface ICategoryRuleRepository {
  findAll(): Promise<CategoryRule[]>
  findById(id: number): Promise<CategoryRule | null>
  create(input: CreateCategoryRuleInput): Promise<CategoryRule>
  update(id: number, input: UpdateCategoryRuleInput): Promise<CategoryRule>
  delete(id: number): Promise<void>
  upsertByPattern(pattern: string, categoria: string): Promise<CategoryRule>
}
