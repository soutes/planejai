export interface IFxRateRepository {
  /**
   * Cotações de moedas estrangeiras → BRL (ex: { USD: 5.42, EUR: 5.91 }).
   * Retorna null se a fonte estiver indisponível (offline, erro de rede).
   */
  getRatesToBRL(currencies: string[]): Promise<Record<string, number> | null>
}
