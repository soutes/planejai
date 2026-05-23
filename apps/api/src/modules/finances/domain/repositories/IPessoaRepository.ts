import type { Pessoa, CreatePessoaInput, UpdatePessoaInput } from '../entities/Pessoa.js'

export interface IPessoaRepository {
  findAll(): Promise<Pessoa[]>
  findById(id: number): Promise<Pessoa | null>
  create(input: CreatePessoaInput): Promise<Pessoa>
  update(id: number, input: UpdatePessoaInput): Promise<Pessoa>
  delete(id: number): Promise<void>
}
