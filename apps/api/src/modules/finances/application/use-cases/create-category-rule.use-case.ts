import { HttpError } from '../../../../shared/errors.js'
import type { ICategoryRuleRepository } from '../../domain/repositories/ICategoryRuleRepository.js'
import type { CategoryRule, CreateCategoryRuleInput } from '../../domain/entities/CategoryRule.js'

export class CreateCategoryRuleUseCase {
  constructor(private readonly repo: ICategoryRuleRepository) {}

  async execute(input: CreateCategoryRuleInput): Promise<CategoryRule> {
    if (!input.pattern.trim()) throw HttpError.badRequest('Pattern não pode ser vazio')
    return this.repo.create(input)
  }
}
