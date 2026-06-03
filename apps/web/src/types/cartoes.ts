export interface CartaoMock {
  id: number
  nome: string
  finalDigitos: string | null
  cor: string
  limite: number | null
  abaId: number | null
  ativo: boolean
  diaFechamento: number
  diaVencimento: number
  proprietario?: string | null
}
