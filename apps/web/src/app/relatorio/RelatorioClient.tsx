'use client'

import { useState } from 'react'
import { Sparkles, RefreshCw, BarChart3 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { apiFetch, currentMesRef } from '@/shared/lib/api'

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

interface RelatorioIA {
  titulo: string
  resumo: string
  destaques: Array<{ tipo: string; titulo: string; descricao: string }>
  alertas: string[]
  recomendacoes: string[]
  comentario_final: string
}

export function RelatorioClient() {
  const [mesRef, setMesRef] = useState(currentMesRef())
  const [relatorio, setRelatorio] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function gerarRelatorio() {
    setLoading(true)
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
    } catch {
      setError('Não foi possível gerar o relatório. Verifique se a API está rodando e a chave de IA está configurada em Gestão → IA.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Controls */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex items-center gap-3">
          <label className="af-label" style={{ marginBottom: 0 }}>Mês de referência:</label>
          <input
            type="month" className="af-input" value={mesRef}
            onChange={(e) => { setMesRef(e.target.value); setRelatorio(null) }}
            style={{ width: 160 }}
          />
        </div>
        <Button
          Icon={loading ? RefreshCw : Sparkles}
          onClick={gerarRelatorio}
          disabled={loading}
        >
          {loading ? 'Gerando relatório...' : relatorio ? 'Gerar novamente' : 'Gerar relatório'}
        </Button>
      </div>

      {/* Estado inicial */}
      {!relatorio && !loading && !error && (
        <div className="af-card" style={{ padding: 0 }}>
          <EmptyState
            icon={BarChart3}
            title="Sem dados para o relatório"
            subtitle="Adicione despesas e rendimentos para gerar análises e insights."
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
            Claude está analisando seu mês financeiro...
          </p>
          <p style={{ color: 'var(--app-text-faint)', fontSize: 12, marginTop: 8 }}>
            Isso leva de 5 a 15 segundos
          </p>
        </div>
      )}

      {/* Relatório */}
      {relatorio && !loading && (
        <div>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: 16,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Sparkles size={16} style={{ color: 'var(--app-accent)' }} />
              <span style={{ fontSize: 12, color: 'var(--app-text-muted)' }}>
                Gerado por Claude · {mesRef}
              </span>
            </div>
            <Button variant="ghost" size="sm" Icon={RefreshCw} onClick={gerarRelatorio}>
              Gerar novamente
            </Button>
          </div>
          <div
            className="af-exec"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(relatorio) }}
          />
          <p style={{ fontSize: 11, color: 'var(--app-text-faint)', marginTop: 12 }}>
            Relatório gerado sob demanda. Dados enviados para IA são apenas agregações por categoria — nenhuma transação individual é compartilhada.
          </p>
        </div>
      )}
    </>
  )
}
