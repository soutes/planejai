'use client'

import { useState, useEffect } from 'react'
import { Sparkles, RefreshCw, BarChart3, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { apiFetch } from '@/shared/lib/api'
import { useMesRef } from '@/shared/context/MesRefContext'

// Module-level cache — survives tab navigation within the same session
interface Cache { mesRef: string; content: string | null; cleared: boolean }
let _cache: Cache | null = null

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
  const [relatorio, setRelatorio] = useState<string | null>(null)
  const [cleared, setCleared] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [modelName, setModelName] = useState('Claude')

  // Restore from cache when tab regains focus or mesRef changes
  useEffect(() => {
    if (_cache?.mesRef === mesRef) {
      setRelatorio(_cache.cleared ? null : _cache.content)
      setCleared(_cache.cleared)
    } else {
      setRelatorio(null)
      setCleared(false)
    }
  }, [mesRef])

  // Fetch AI model name once
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
      const result = await apiFetch<RelatorioIA>('/api/intelligence/report', {
        method: 'POST',
        body: JSON.stringify({ mesRef }),
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
      _cache = { mesRef, content: md, cleared: false }
    } catch {
      setError('Não foi possível gerar o relatório. Verifique se a API está rodando e a chave de IA está configurada em Configurações → IA.')
    } finally {
      setLoading(false)
    }
  }

  function excluirRelatorio() {
    setRelatorio(null)
    setCleared(true)
    _cache = { mesRef, content: null, cleared: true }
  }

  const mesLabel = mesRef.replace(/^(\d{4})-(\d{2})$/, '$2/$1')
  const showReport = relatorio && !loading && !cleared

  return (
    <>
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
            subtitle="Clique em Gerar relatório para obter uma análise executiva do mês."
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
            {modelName} está analisando seu mês financeiro...
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
                Gerado por {modelName} · {mesLabel}
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
