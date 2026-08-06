'use client'

import { useEffect } from 'react'
import { AlertTriangle, RotateCw } from 'lucide-react'

// Error boundary de rota. Sem ele, um erro de render caía na tela padrão do Next —
// que num app financeiro é pior do que inútil: o usuário não sabe se o dado está
// errado, se sumiu, ou se foi só a tela que quebrou.
//
// Regra do projeto: erro tem que aparecer. Nada de tela zerada em silêncio.
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[planejAÍ] erro de rota:', error)
  }, [error])

  return (
    <div
      role="alert"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        textAlign: 'center',
        padding: 32,
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 16,
          display: 'grid',
          placeItems: 'center',
          background: 'rgba(242, 58, 10, 0.10)',
          border: '1px solid rgba(242, 58, 10, 0.25)',
          marginBottom: 18,
        }}
      >
        <AlertTriangle size={26} color="var(--vermelho)" aria-hidden="true" />
      </div>

      <h2 style={{ fontSize: 19, fontWeight: 700, color: 'var(--app-text)', marginBottom: 8 }}>
        Não foi possível carregar esta tela
      </h2>
      <p style={{ fontSize: 14, color: 'var(--app-text-muted)', maxWidth: 460, lineHeight: 1.6 }}>
        Seus dados estão salvos — o problema foi só na exibição. Tente de novo; se
        continuar, feche e abra o planejAÍ.
      </p>

      {/* A mensagem técnica fica visível de propósito: é app local, e sem ela não
          há como reportar o que aconteceu. */}
      <pre
        style={{
          marginTop: 18,
          padding: '10px 14px',
          maxWidth: 560,
          fontFamily: 'var(--font-mono), monospace',
          fontSize: 11,
          lineHeight: 1.6,
          color: 'var(--app-text-muted)',
          background: 'var(--surface)',
          border: '1px solid var(--line)',
          borderRadius: 8,
          textAlign: 'left',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
      >
        {error.message}
        {error.digest ? `\ndigest: ${error.digest}` : ''}
      </pre>

      <button
        onClick={reset}
        style={{
          marginTop: 22,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '10px 18px',
          borderRadius: 10,
          border: '1px solid var(--line)',
          background: 'var(--verde)',
          color: '#0B0D0C',
          fontSize: 14,
          fontWeight: 700,
          cursor: 'pointer',
        }}
      >
        <RotateCw size={15} aria-hidden="true" />
        Tentar novamente
      </button>
    </div>
  )
}
