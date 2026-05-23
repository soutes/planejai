export interface CategoryRule {
  id: number
  pattern: string
  categoria: string
  createdAt: string
}

export interface CreateCategoryRuleInput {
  pattern: string
  categoria: string
}

export interface UpdateCategoryRuleInput {
  pattern?: string
  categoria?: string
}
