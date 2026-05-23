const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = { ...(init?.headers as Record<string, string>) }
  if (init?.body != null && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json'
  }
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    const e = err as { message?: string; error?: string; details?: string }
    const msg = e.message ?? e.error ?? e.details ?? `HTTP ${res.status}`
    throw new Error(msg)
  }
  if (res.status === 204 || res.headers.get('content-length') === '0') {
    return null as T
  }
  return res.json() as Promise<T>
}

export function currentMesRef(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}
