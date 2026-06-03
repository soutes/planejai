'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { HandCoins, ChevronDown } from 'lucide-react'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatMoney } from '@/components/ui/MoneyValue'
import { apiFetch } from '@/shared/lib/api'
import { useMesRef } from '@/shared/context/MesRefContext'
import { formatMesRefNum, formatDataBR } from '@/shared/lib/format'
import { AcertoCard, type SaldoPessoa } from './AcertoCard'
import type { DespesaMock, DespesaSplit } from '@/types/despesas'

interface Pessoa { id: number; nome: string; padrao?: boolean }
interface Aba { id: number; nome: string; cor: string; pessoaId: number | null; membros: number[] }

export function AcertoClient() {
  const { mesRef } = useMesRef()
  const [saldos, setSaldos] = useState<SaldoPessoa[]>([])
  const [padraoNome, setPadraoNome] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const [abas, setAbas] = useState<Aba[]>([])
  const [pessoas, setPessoas] = useState<Pessoa[]>([])
  const [despesas, setDespesas] = useState<DespesaMock[]>([])
  const [grupoSelecionadoId, setGrupoSelecionadoId] = useState<number | null>(null)

  const grupoAbas = useMemo(() => abas.filter((a) => a.pessoaId == null), [abas])
  const grupoAtivo = useMemo(
    () => grupoAbas.find((a) => a.id === grupoSelecionadoId) ?? grupoAbas[0] ?? null,
    [grupoAbas, grupoSelecionadoId],
  )

  const despesasGrupo = useMemo(() => {
    if (!grupoAtivo || grupoAtivo.membros.length === 0) return despesas.filter((d) => d.splits?.length)
    const membroSet = new Set(grupoAtivo.membros)
    return despesas.filter((d) => d.splits?.length && d.splits.every((s) => membroSet.has(s.pessoaId)))
  }, [despesas, grupoAtivo])

  // Quem fronteou o pagamento: pagador explícito (cartão de grupo) ou dono da aba.
  // Sem dono (aba de grupo sem pagador) → cai no padrão (mesma convenção do backend).
  const abaOwner = useMemo(() => new Map(abas.map((a) => [a.id, a.pessoaId])), [abas])
  const pessoaNome = useMemo(() => new Map(pessoas.map((p) => [p.id, p.nome])), [pessoas])
  const payerNome = useCallback(
    (d: DespesaMock): string => {
      const ownerId = d.pagadorId ?? abaOwner.get(d.abaId) ?? null
      if (ownerId != null) return pessoaNome.get(ownerId) ?? d.aba
      return padraoNome ?? d.aba
    },
    [abaOwner, pessoaNome, padraoNome],
  )

  // Quanto cada responsável cobriu (pagou por despesas compartilhadas)
  const coberturasPorPessoa = useMemo(() => {
    const map = new Map<string, number>()
    for (const d of despesasGrupo) {
      const nome = payerNome(d)
      map.set(nome, (map.get(nome) ?? 0) + d.valor)
    }
    return Array.from(map.entries())
      .map(([nome, total]) => ({ nome, total }))
      .sort((a, b) => b.total - a.total)
  }, [despesasGrupo, payerNome])

  const totalGrupo = despesasGrupo.reduce((sum, d) => sum + d.valor, 0)
  const comSaldo = saldos.filter((s) => Math.abs(s.saldoTotal) > 0.01)

  // Metadata: pessoas + abas (não depende do grupo selecionado)
  useEffect(() => {
    Promise.all([apiFetch<Pessoa[]>('/api/pessoas'), apiFetch<Aba[]>('/api/abas')])
      .then(([ps, abs]) => {
        const padrao = ps.find((p) => p.padrao)
        setPadraoNome(padrao?.nome ?? null)
        setPessoas(ps)
        setAbas(abs)
      })
      .catch(() => setPadraoNome(null))
  }, [])

  // Saldos com scope no grupo selecionado (passa membros → backend isola o grupo)
  useEffect(() => {
    setLoading(true)
    const membrosParam =
      grupoAtivo && grupoAtivo.membros.length > 0 ? `&membros=${grupoAtivo.membros.join(',')}` : ''
    apiFetch<SaldoPessoa[]>(`/api/acerto?mesRef=${mesRef}&incluirAnteriores=false${membrosParam}`)
      .then((rows) => setSaldos(rows ?? []))
      .catch(() => setSaldos([]))
      .finally(() => setLoading(false))
  }, [mesRef, grupoAtivo])

  useEffect(() => {
    if (abas.length === 0 || pessoas.length === 0) return
    type ApiSplit = { pessoaId: number; ratio: number; valorCalculado: number; valorQuitado?: number }
    type ApiDespesa = Omit<DespesaMock, 'aba' | 'splits'> & { splits?: ApiSplit[] }
    apiFetch<ApiDespesa[]>(`/api/despesas?mesRef=${mesRef}`)
      .then((rows) => setDespesas(rows.map((r) => ({
        ...r,
        aba: abas.find((a) => a.id === r.abaId)?.nome ?? '',
        splits: r.splits?.length
          ? r.splits.map((s) => ({
              pessoaId: s.pessoaId,
              pessoa: pessoas.find((p) => p.id === s.pessoaId)?.nome ?? '',
              percentual: s.ratio * 100,
              valorCalculado: s.valorCalculado,
              valorQuitado: s.valorQuitado ?? 0,
            }))
          : undefined,
      }))))
      .catch(() => {})
  }, [mesRef, abas, pessoas])

  return (
    <>
      {/* Hero — dois painéis */}
      <div style={{
        background: 'var(--section-hero-bg, #06281C)',
        border: '1px solid var(--section-hero-border, rgba(16,245,163,0.30))',
        borderRadius: 16, padding: '24px 28px', marginBottom: 20,
        display: 'flex', gap: 32, alignItems: 'stretch',
      }}>
        {/* Painel esquerdo — quem cobriu quanto */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.10em', color: 'var(--section-accent, #10F5A3)', marginBottom: 16 }}>
            Cobertura · {formatMesRefNum(mesRef)}
          </div>
          {coberturasPorPessoa.length === 0 ? (
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>Sem despesas compartilhadas</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {coberturasPorPessoa.map(({ nome, total }) => (
                <div key={nome} style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', minWidth: 80 }}>{nome} pagou</span>
                  <span className="mono" style={{ fontSize: 18, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>
                    {formatMoney(total)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Divisor */}
        <div style={{ width: 1, background: 'rgba(16,245,163,0.15)', flexShrink: 0 }} />

        {/* Painel direito — saldo líquido */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.10em', color: 'var(--section-accent, #10F5A3)', marginBottom: 16 }}>
            Saldo pendente
          </div>
          {comSaldo.length === 0 ? (
            <div style={{ fontSize: 14, color: 'var(--verde, #10F5A3)', fontWeight: 600 }}>Tudo quitado ✓</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {comSaldo.map((s) => {
                const eu = padraoNome ?? 'você'
                // a_receber = padrao recebe de s.nome → credor: eu, devedor: s.nome
                // a_pagar   = s.nome recebe de padrao → credor: s.nome, devedor: eu
                const credor = s.direcao === 'a_receber' ? eu : s.nome
                const devedor = s.direcao === 'a_receber' ? s.nome : eu
                return (
                  <div key={s.pessoaId} style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', marginBottom: 4 }}>
                      <strong style={{ color: '#fff' }}>{credor}</strong> tem a receber de <strong style={{ color: '#fff' }}>{devedor}</strong>
                    </div>
                    <span className="mono" style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--verde, #10F5A3)' }}>
                      {formatMoney(Math.abs(s.saldoTotal))}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="af-card"><p style={{ padding: 24, color: 'var(--app-text-muted)' }}>Carregando…</p></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Despesas do grupo */}
          <div className="af-card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '16px 20px', borderBottom: '1px solid var(--line)',
            }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--app-text)', letterSpacing: '-0.01em' }}>
                  Despesas do grupo
                </div>
                <div style={{ fontSize: 11, color: 'var(--app-text-muted)', marginTop: 2 }}>
                  {despesasGrupo.length} lançamento{despesasGrupo.length !== 1 ? 's' : ''} · total {formatMoney(totalGrupo)}
                </div>
              </div>

              {grupoAbas.length > 1 && (
                <div style={{ position: 'relative' }}>
                  <select
                    value={grupoAtivo?.id ?? ''}
                    onChange={(e) => setGrupoSelecionadoId(Number(e.target.value))}
                    style={{
                      appearance: 'none' as const,
                      background: '#0D1510',
                      border: '1px solid var(--line)',
                      borderRadius: 8,
                      color: 'var(--app-text)',
                      fontSize: 12, fontWeight: 600,
                      padding: '6px 28px 6px 10px',
                      cursor: 'pointer',
                    }}
                  >
                    {grupoAbas.map((a) => (
                      <option key={a.id} value={a.id} style={{ background: '#0D1510', color: '#fff' }}>{a.nome}</option>
                    ))}
                  </select>
                  <ChevronDown size={12} style={{
                    position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                    pointerEvents: 'none', color: 'var(--app-text-muted)',
                  }} />
                </div>
              )}
            </div>

            {despesasGrupo.length === 0 ? (
              <div style={{ padding: 0 }}>
                <EmptyState
                  icon={HandCoins}
                  title="Sem despesas compartilhadas"
                  subtitle="Nenhuma despesa com divisão de grupo neste mês."
                />
              </div>
            ) : (
              <table className="af-table">
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Descrição</th>
                    <th>Categoria</th>
                    <th>Responsável</th>
                    <th style={{ textAlign: 'right' }}>Total</th>
                    <th>Divisão</th>
                  </tr>
                </thead>
                <tbody>
                  {despesasGrupo.map((d) => (
                    <tr key={d.id}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                        {formatDataBR(d.data)}
                      </td>
                      <td>{d.descricao}</td>
                      <td><span className="chip">{d.categoria}</span></td>
                      <td style={{ color: 'var(--app-text-muted)', fontSize: 12 }}>{payerNome(d)}</td>
                      <td className="mono" style={{ textAlign: 'right', fontWeight: 700, color: 'var(--app-danger)' }}>
                        {formatMoney(d.valor)}
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          {d.splits?.map((s: DespesaSplit) => (
                            <span key={s.pessoaId} style={{
                              fontSize: 10, padding: '2px 6px', borderRadius: 4,
                              background: 'rgba(176,122,255,0.12)',
                              color: 'var(--roxo, #B07AFF)',
                              fontWeight: 600,
                            }}>
                              {s.pessoa} {Math.round(s.percentual)}%
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </>
  )
}
