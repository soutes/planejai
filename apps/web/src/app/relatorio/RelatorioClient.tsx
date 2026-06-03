'use client'

import { useState, useEffect, useMemo } from 'react'
import { Sparkles, RefreshCw, BarChart3, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { apiFetch } from '@/shared/lib/api'
import { useMesRef } from '@/shared/context/MesRefContext'

interface Pessoa { id: number; nome: string; cor: string; ativo: boolean; familiar: boolean; padrao?: boolean }

// number = pessoa | null = Familiar | undefined = sem tabs (single-user / global)
type TabId = number | null | undefined

// Module-level cache — survives tab navigation within the same session.
// Chaveado por (mesRef, escopo) para não misturar relatório de pessoas diferentes.
interface CacheEntry { content: string | null; cleared: boolean }
const _cache: Record<string, CacheEntry> = {}
function cacheKey(mesRef: string, tab: TabId): string {
  return `${mesRef}|${tab === undefined ? 'all' : tab === null ? 'familiar' : tab}`
}

function sortByPadrao<T extends { padrao?: boolean; nome: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    if (a.padrao && !b.padrao) return -1
    if (!a.padrao && b.padrao) return 1
    return a.nome.localeCompare(b.nome, 'pt-BR')
  })
}

function renderMarkdown(md: string): string {
  return md
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
    .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/^(?!<[hul])(.+)$/gm, '<p>$1</p>')
    .replace(/<p><\/p>/g, '')
}

function formatModelName(model: string): string {
  if (!model) return 'IA'
  const m = model.match(/^claude-(sonnet|opus|haiku)-(\d+)-?(\d*)/)
  if (m) {
    const [, variant, major, minor] = m
    const name = variant.charAt(0).toUpperCase() + variant.slice(1)
    return `Claude ${name} ${major}${minor ? '.' + minor : ''}`
  }
  const slash = model.lastIndexOf('/')
  return slash >= 0 ? model.slice(slash + 1) : model
}

interface RelatorioIA {
  titulo: string
  resumo: string
  destaques: Array<{ tipo: string; titulo: string; descricao: string }>
  alertas: string[]
  recomendacoes: string[]
  comentario_final: string
}

export function RelatorioClient() {
  const { mesRef } = useMesRef()
  const [pessoas, setPessoas] = useState<Pessoa[]>([])
  const [grupoAbas, setGrupoAbas] = useState<{ id: number; nome: string; cor: string }[]>([])
  const [selectedTab, setSelectedTab] = useState<TabId>(undefined)
  const [relatorio, setRelatorio] = useState<string | null>(null)
  const [cleared, setCleared] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [modelName, setModelName] = useState('Claude')

  const showTabs = pessoas.length > 1

  // Carrega pessoas + abas de grupo (mesmo padrão de Rendimentos/Investimentos)
  useEffect(() => {
    Promise.all([
      apiFetch<Pessoa[]>('/api/pessoas'),
      apiFetch<{ id: number; nome: string; cor: string; pessoaId: number | null }[]>('/api/abas'),
    ])
      .then(([p, abas]) => {
        const ativos = sortByPadrao(p.filter((x) => x.ativo))
        setPessoas(ativos)
        setGrupoAbas(abas.filter((a) => a.pessoaId == null))
        if (ativos.length > 1) setSelectedTab((cur) => (cur === undefined ? ativos[0].id : cur))
      })
      .catch(() => {})
  }, [])

  // Restaura do cache ao trocar mês ou pessoa
  useEffect(() => {
    const entry = _cache[cacheKey(mesRef, selectedTab)]
    if (entry) {
      setRelatorio(entry.cleared ? null : entry.content)
      setCleared(entry.cleared)
    } else {
      setRelatorio(null)
      setCleared(false)
    }
    setError(null)
  }, [mesRef, selectedTab])

  // Nome do modelo de IA
  useEffect(() => {
    apiFetch<{ provider: string; model: string }>('/api/config/ia')
      .then((c) => setModelName(formatModelName(c.model)))
      .catch(() => {})
  }, [])

  async function gerarRelatorio() {
    setLoading(true)
    setCleared(false)
    setError(null)
    try {
      const body: Record<string, unknown> = { mesRef }
      // Escopo: só envia pessoaId quando há tabs (multi-pessoa). undefined = global.
      if (showTabs && selectedTab !== undefined) body.pessoaId = selectedTab
      const result = await apiFetch<RelatorioIA>('/api/intelligence/report', {
        method: 'POST',
        body: JSON.stringify(body),
      })
      const md = [
        `## ${result.titulo}`,
        result.resumo,
        ...result.destaques.map((d) => `### ${d.titulo}\n${d.descricao}`),
        result.alertas.length ? `## Alertas\n${result.alertas.map((a) => `- ${a}`).join('\n')}` : '',
        result.recomendacoes.length ? `## Recomendações\n${result.recomendacoes.map((r) => `- ${r}`).join('\n')}` : '',
        result.comentario_final,
      ].filter(Boolean).join('\n\n')
      setRelatorio(md)
      _cache[cacheKey(mesRef, selectedTab)] = { content: md, cleared: false }
    } catch {
      setError('Não foi possível gerar o relatório. Verifique se a API está rodando e a chave de IA está configurada em Configurações → IA.')
    } finally {
      setLoading(false)
    }
  }

  function excluirRelatorio() {
    setRelatorio(null)
    setCleared(true)
    _cache[cacheKey(mesRef, selectedTab)] = { content: null, cleared: true }
  }

  const mesLabel = mesRef.replace(/^(\d{4})-(\d{2})$/, '$2/$1')
  const showReport = relatorio && !loading && !cleared
  const escopoLabel = useMemo(() => {
    if (!showTabs || selectedTab === undefined) return null
    if (selectedTab === null) return grupoAbas[0]?.nome ?? 'Familiar'
    return pessoas.find((p) => p.id === selectedTab)?.nome ?? null
  }, [showTabs, selectedTab, pessoas, grupoAbas])

  return (
    <>
      {/* Tabs por pessoa */}
      {showTabs && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          {pessoas.map((p) => {
            const isSelected = selectedTab === p.id
            return (
              <button
                key={p.id}
                onClick={() => setSelectedTab(p.id)}
                style={{
                  padding: '6px 18px', borderRadius: 20,
                  border: `1px solid ${isSelected ? p.cor : 'rgba(255,255,255,0.12)'}`,
                  background: isSelected ? `${p.cor}22` : 'transparent',
                  color: isSelected ? p.cor : 'var(--ink-400)',
                  fontSize: 13, fontWeight: isSelected ? 700 : 400,
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
              >
                {p.nome}
              </button>
            )
          })}
          {grupoAbas.map((g) => (
            <button
              key={g.id}
              onClick={() => setSelectedTab(null)}
              style={{
                padding: '6px 18px', borderRadius: 20,
                border: `1px solid ${selectedTab === null ? 'var(--verde)' : 'rgba(255,255,255,0.12)'}`,
                background: selectedTab === null ? 'rgba(16,245,163,0.13)' : 'transparent',
                color: selectedTab === null ? 'var(--verde)' : 'var(--ink-400)',
                fontSize: 13, fontWeight: selectedTab === null ? 700 : 400,
                cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              {g.nome}
            </button>
          ))}
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center gap-3 mb-6">
        <Button
          Icon={loading ? RefreshCw : Sparkles}
          onClick={gerarRelatorio}
          disabled={loading}
        >
          {loading ? 'Gerando relatório...' : showReport ? 'Gerar novamente' : 'Gerar relatório'}
        </Button>
        {showReport && (
          <Button variant="danger" size="sm" Icon={Trash2} onClick={excluirRelatorio}>
            Excluir
          </Button>
        )}
      </div>

      {/* Estado inicial */}
      {!showReport && !loading && !error && (
        <div className="af-card" style={{ padding: 0 }}>
          <EmptyState
            icon={BarChart3}
            title="Sem relatório gerado"
            subtitle={escopoLabel
              ? `Clique em Gerar relatório para a análise executiva de ${escopoLabel}.`
              : 'Clique em Gerar relatório para obter uma análise executiva do mês.'}
          />
        </div>
      )}

      {/* Erro */}
      {error && !loading && (
        <div className="af-card" style={{ padding: 24, borderLeft: '3px solid var(--vermelho)' }}>
          <p style={{ fontSize: 14, color: 'var(--app-text-faint)' }}>{error}</p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="af-card" style={{ textAlign: 'center', padding: 64 }}>
          <div className="spinner" style={{ margin: '0 auto 20px', width: 32, height: 32, borderWidth: 3 }} />
          <p style={{ color: 'var(--app-text-muted)', fontSize: 14 }}>
            {modelName} está analisando {escopoLabel ? `as finanças de ${escopoLabel}` : 'seu mês financeiro'}...
          </p>
          <p style={{ color: 'var(--app-text-faint)', fontSize: 12, marginTop: 8 }}>
            Isso leva de 5 a 15 segundos
          </p>
        </div>
      )}

      {/* Relatório */}
      {showReport && (
        <div>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: 16,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Sparkles size={16} style={{ color: 'var(--section-accent, #F59E0B)' }} />
              <span style={{ fontSize: 12, color: 'var(--app-text-muted)' }}>
                Gerado por {modelName} · {mesLabel}{escopoLabel ? ` · ${escopoLabel}` : ''}
              </span>
            </div>
            <Button variant="ghost" size="sm" Icon={RefreshCw} onClick={gerarRelatorio}>
              Gerar novamente
            </Button>
          </div>
          <div
            className="af-exec"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(relatorio!) }}
          />
          <p style={{ fontSize: 11, color: 'var(--app-text-faint)', marginTop: 12 }}>
            Relatório gerado sob demanda. Dados enviados para IA são apenas agregações por categoria — nenhuma transação individual é compartilhada.
          </p>
        </div>
      )}
    </>
  )
}
