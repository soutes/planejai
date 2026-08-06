// Esqueleto exibido enquanto um Server Component da rota resolve.
//
// Existe porque as páginas são `async` e buscam da API antes de renderizar: sem
// fallback, clicar num item da sidebar deixava a tela anterior congelada por
// segundos, sem nenhum sinal de que algo estava acontecendo.
//
// Desenha a silhueta da página (cabeçalho + KPIs + bloco de conteúdo) em vez de um
// spinner solto — o layout não "pula" quando o conteúdo real chega.

interface PageSkeletonProps {
  /** Quantos cartões de KPI a página costuma mostrar. 0 esconde a faixa. */
  kpis?: number
  /** Altura do bloco principal (gráfico ou tabela), em px. */
  alturaConteudo?: number
}

const barra = (largura: number | string, altura: number, radius = 6) => ({
  width: typeof largura === 'number' ? `${largura}px` : largura,
  height: `${altura}px`,
  borderRadius: `${radius}px`,
})

export function PageSkeleton({ kpis = 4, alturaConteudo = 320 }: PageSkeletonProps) {
  return (
    <div
      className="af-skeleton"
      // aria-busy + role=status fazem o leitor de tela anunciar o carregamento
      // em vez de ler uma tela vazia.
      role="status"
      aria-busy="true"
      aria-label="Carregando conteúdo da página"
    >
      <span className="af-sr-only">Carregando…</span>

      {/* Cabeçalho */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
        <div className="af-skel-bar" style={barra(40, 40, 10)} />
        <div>
          <div className="af-skel-bar" style={{ ...barra(180, 20), marginBottom: 8 }} />
          <div className="af-skel-bar" style={barra(240, 13)} />
        </div>
      </div>

      {/* Faixa de KPIs */}
      {kpis > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(auto-fit, minmax(200px, 1fr))`,
            gap: 16,
            marginBottom: 24,
          }}
        >
          {Array.from({ length: kpis }).map((_, i) => (
            <div
              key={i}
              className="af-card"
              style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}
            >
              <div className="af-skel-bar" style={barra('55%', 12)} />
              <div className="af-skel-bar" style={barra('75%', 26)} />
            </div>
          ))}
        </div>
      )}

      {/* Bloco principal */}
      <div className="af-card" style={{ padding: 20 }}>
        <div className="af-skel-bar" style={{ ...barra(200, 16), marginBottom: 20 }} />
        <div className="af-skel-bar" style={barra('100%', alturaConteudo, 10)} />
      </div>
    </div>
  )
}
