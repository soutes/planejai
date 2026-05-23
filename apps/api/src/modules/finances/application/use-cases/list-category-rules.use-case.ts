import type { ICategoryRuleRepository } from '../../domain/repositories/ICategoryRuleRepository.js'
import type { CategoryRule } from '../../domain/entities/CategoryRule.js'

export class ListCategoryRulesUseCase {
  constructor(private readonly repo: ICategoryRuleRepository) {}

  async execute(): Promise<CategoryRule[]> {
    return this.repo.findAll()
  }
}
