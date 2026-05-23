import { HttpError } from '../../../../shared/errors.js'
import type { ICategoryRuleRepository } from '../../domain/repositories/ICategoryRuleRepository.js'

export class DeleteCategoryRuleUseCase {
  constructor(private readonly repo: ICategoryRuleRepository) {}

  async execute(id: number): Promise<void> {
    const rule = await this.repo.findById(id)
    if (!rule) throw HttpError.notFound(`Regra de categoria ${id} não encontrada`)
    await this.repo.delete(id)
  }
}
