// ── helpers ──────────────────────────────────────────────────────────
const fmtBRL = (v) => {
  if (v == null) return '—';
  const sign = v < 0 ? '−' : '';
  const n = Math.abs(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${sign}R$ ${n}`;
};

// ── KPI card ─────────────────────────────────────────────────────────
const KPICard = ({ label, value, sub, color = '#10F5A3', signed = false, negative = false }) => (
  <div className="gf-kpi" style={{ borderTop: `3px solid ${color}` }}>
    <div className="gf-kpi-label">{label}</div>
    <div className="gf-kpi-value" style={negative ? { color: '#FF6B7A' } : undefined}>
      {signed && typeof value === 'number' && value > 0 ? '+' : ''}{typeof value === 'number' ? fmtBRL(value) : value}
    </div>
    {sub && <div className="gf-kpi-sub">{sub}</div>}
  </div>
);

// ── Glow KPI box ─────────────────────────────────────────────────────
const GlowKPI = ({ title, items }) => (
  <div className="af-glow">
    <div className="af-glow-title">{title}</div>
    <div className="af-kpi-grid">
      {items.map((it, i) => (
        <div className="af-kpi-cell" key={i}>
          <div className="af-kpi-label">{it.label}</div>
          <div className="af-kpi-value" style={it.color ? { color: it.color } : undefined}>
            {it.value}
          </div>
          {it.sub && <div className="af-kpi-sub">{it.sub}</div>}
        </div>
      ))}
    </div>
  </div>
);

// ── Section heading ──────────────────────────────────────────────────
const SectionH = ({ children, color }) => (
  <div className="af-h" style={{ margin: '18px 0 12px 2px' }}>
    <span
      className="af-h-bar"
      style={color
        ? { background: `linear-gradient(180deg, ${color}, ${color}cc)`, boxShadow: `0 0 8px ${color}99` }
        : { background: 'linear-gradient(180deg, #10F5A3, #0FCC88)', boxShadow: '0 0 8px rgba(16,245,163,0.5)' }
      }
    />
    <span>{children}</span>
  </div>
);

// ── Big progress bar ─────────────────────────────────────────────────
const BigProgress = ({ gasto, limite, color = '#10F5A3', updated }) => {
  const pct = limite > 0 ? (gasto / limite) * 100 : 0;
  const pctC = Math.max(2, Math.min(100, pct));
  const saldo = limite - gasto;
  const saldoColor = saldo >= 0 ? '#10F5A3' : '#FF6B7A';
  const saldoLabel = saldo >= 0 ? 'Saldo disponível' : 'Estourou em';
  return (
    <div className="af-bigbar-card">
      <div className="af-bigbar-head">
        <div>
          <div className="af-bigbar-label">Gasto no ciclo</div>
          <div className="af-bigbar-val" style={{ color }}>
            {fmtBRL(gasto)}<span className="af-bigbar-of">de {fmtBRL(limite)}</span>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="af-bigbar-label">{saldoLabel}</div>
          <div className="af-bigbar-val" style={{ color: saldoColor }}>{fmtBRL(Math.abs(saldo))}</div>
        </div>
      </div>
      <div className="af-bigbar-track">
        <div
          className="af-bigbar-fill"
          style={{
            width: `${pctC}%`,
            background: `linear-gradient(90deg, ${color}00 0%, ${color}66 25%, ${color} 100%)`,
            boxShadow: `0 0 12px ${color}99, 0 0 24px ${color}44`,
          }}
        />
      </div>
      <div className="af-bigbar-foot">
        <span style={{ color, fontWeight: 700 }}>{pct.toFixed(1)}% do limite</span>
        {updated && <span style={{ color: '#6E7A8C', fontSize: 11 }}>Atualizado {updated}</span>}
      </div>
    </div>
  );
};

// ── Category progress rows ───────────────────────────────────────────
const ProgressCategorias = ({ items, color = '#B07AFF' }) => {
  const max = Math.max(...items.map(i => i.valor));
  return (
    <div className="af-prog-card">
      {items.map((r, i) => {
        const c = r.color || color;
        const w = Math.max(3, Math.min(100, (r.valor / max) * 100));
        return (
          <div className="af-prog-row" key={i}>
            <div>
              <div className="af-prog-head">
                <span className="af-prog-name">{r.categoria}</span>
                <span className="af-prog-pct" style={{ color: c }}>{r.pct.toFixed(1)}%</span>
              </div>
              <div className="af-prog-track">
                <div
                  className="af-prog-fill"
                  style={{
                    width: `${w}%`,
                    background: `linear-gradient(90deg, ${c}00 0%, ${c}66 35%, ${c} 100%)`,
                  }}
                />
              </div>
            </div>
            <div className="af-prog-side">
              <div className="af-prog-val">{fmtBRL(r.valor)}</div>
              <div className="af-prog-sub">{r.qtd} transações</div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ── Alert line ───────────────────────────────────────────────────────
const AlertLine = ({ text, value, level = 'warn' }) => {
  const conf = {
    warn:    { color: '#D4A017', icon: <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z M12 9v4 M12 17h.01" />, cls: '' },
    parcela: { color: '#A3E635', icon: <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>, cls: 'af-alert--parcela' },
    danger:  { color: '#FF6B7A', icon: <><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></>, cls: '' },
  }[level];
  return (
    <div className={`af-alert ${conf.cls}`} style={level === 'danger' ? { borderLeftColor: '#FF6B7A' } : undefined}>
      <span style={{ color: conf.color, display: 'inline-flex' }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {conf.icon}
        </svg>
      </span>
      <span className="af-alert-text">{text}</span>
      {value && <span className="af-alert-val">{value}</span>}
    </div>
  );
};

// ── Exec summary block ───────────────────────────────────────────────
const ExecSummary = ({ children }) => <div className="af-exec">{children}</div>;

// ── Bank chip strip ──────────────────────────────────────────────────
const BankChip = ({ name, finalDigits, color, active, onClick }) => (
  <button
    onClick={onClick}
    className="bank-chip"
    style={
      active
        ? {
            background: `${color}22`,
            borderColor: `${color}99`,
            boxShadow: `0 0 12px ${color}44`,
            color: '#E8ECF2',
            cursor: 'pointer',
          }
        : {
            background: `${color}0C`,
            borderColor: `${color}44`,
            color: '#8B92A0',
            cursor: 'pointer',
          }
    }
  >
    <span className="bank-chip__dot" style={{ background: color }}></span>
    {name}{finalDigits && ` ···${finalDigits}`}
  </button>
);

// ── Tabs ─────────────────────────────────────────────────────────────
const Tabs = ({ tabs, active, onChange }) => (
  <div className="kit-tabs">
    {tabs.map(t => (
      <button
        key={t.id}
        className={`kit-tab${active === t.id ? ' is-active' : ''}`}
        onClick={() => onChange(t.id)}
      >
        {t.label}
      </button>
    ))}
  </div>
);

Object.assign(window, { fmtBRL, KPICard, GlowKPI, SectionH, BigProgress, ProgressCategorias, AlertLine, ExecSummary, BankChip, Tabs });
