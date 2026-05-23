import type { Cartao, CreateCartaoInput, UpdateCartaoInput } from '../entities/Cartao.js'

export interface ICartaoRepository {
  findAll(): Promise<Cartao[]>
  findById(id: number): Promise<Cartao | null>
  create(input: CreateCartaoInput): Promise<Cartao>
  update(id: number, input: UpdateCartaoInput): Promise<Cartao>
  delete(id: number): Promise<void>
}
