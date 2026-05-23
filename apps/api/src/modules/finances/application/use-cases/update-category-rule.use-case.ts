import { HttpError } from '../../../../shared/errors.js'
import type { ICategoryRuleRepository } from '../../domain/repositories/ICategoryRuleRepository.js'
import type { CategoryRule, UpdateCategoryRuleInput } from '../../domain/entities/CategoryRule.js'

export class UpdateCategoryRuleUseCase {
  constructor(private readonly repo: ICategoryRuleRepository) {}

  async execute(id: number, input: UpdateCategoryRuleInput): Promise<CategoryRule> {
    const rule = await this.repo.findById(id)
    if (!rule) throw HttpError.notFound(`Regra de categoria ${id} não encontrada`)
    return this.repo.update(id, input)
  }
}
