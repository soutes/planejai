import type { IFxRateRepository } from '../domain/repositories/IFxRateRepository.js'

interface CacheEntry {
  rates: Record<string, number>
  fetchedAt: number
}

/**
 * Cotações via AwesomeAPI (https://docs.awesomeapi.com.br/api-de-moedas).
 * Endpoint público, sem chave, funciona localmente. Cache em memória de 1h
 * (câmbio do dia muda pouco; evita rede em importações sucessivas).
 */
export class AwesomeFxRateRepository implements IFxRateRepository {
  private static readonly BASE = 'https://economia.awesomeapi.com.br/last/'
  private static readonly TTL_MS = 60 * 60 * 1000 // 1h
  private static readonly TIMEOUT_MS = 6000

  private cache = new Map<string, CacheEntry>()

  async getRatesToBRL(currencies: string[]): Promise<Record<string, number> | null> {
    const wanted = Array.from(new Set(currencies.map((c) => c.toUpperCase()).filter((c) => c && c !== 'BRL')))
    if (wanted.length === 0) return {}

    const now = Date.now()
    const result: Record<string, number> = {}
    const missing: string[] = []

    for (const cur of wanted) {
      const hit = this.cache.get(cur)
      if (hit && now - hit.fetchedAt < AwesomeFxRateRepository.TTL_MS) {
        Object.assign(result, hit.rates)
      } else {
        missing.push(cur)
      }
    }

    if (missing.length === 0) return result

    const pairs = missing.map((c) => `${c}-BRL`).join(',')
    const url = `${AwesomeFxRateRepository.BASE}${pairs}`

    try {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), AwesomeFxRateRepository.TIMEOUT_MS)
      const res = await fetch(url, { signal: controller.signal })
      clearTimeout(timer)
      if (!res.ok) return Object.keys(result).length > 0 ? result : null

      // Formato: { "USDBRL": { "code":"USD", "bid":"5.42", ... }, ... }
      const data = (await res.json()) as Record<string, { code?: string; bid?: string }>
      for (const entry of Object.values(data)) {
        const code = entry.code?.toUpperCase()
        const bid = entry.bid != null ? Number(entry.bid) : NaN
        if (code && Number.isFinite(bid) && bid > 0) {
          result[code] = bid
          this.cache.set(code, { rates: { [code]: bid }, fetchedAt: now })
        }
      }
      return result
    } catch {
      // Offline ou timeout: retorna o que tiver em cache, ou null.
      return Object.keys(result).length > 0 ? result : null
    }
  }
}
