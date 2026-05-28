// ─────────────────────────────────────────────────────────────────────
// PAGE: Visão Geral — KPI row, donut + bars, abas, vencimentos, divisão
// ─────────────────────────────────────────────────────────────────────
const VisaoGeral = ({ month }) => (
  <>
    <PageHeader title="Visão Geral" subtitle={month} />

    {/* KPI Row */}
    <div className="kpi-row">
      <KPICard label="SALDO DO MÊS" value={1482.6} sub="receitas − despesas" color="#10F5A3"/>
      <KPICard label="RENDIMENTOS" value={8400} sub="total recebido em Mai" color="#6FA9D6"/>
      <KPICard label="DESPESAS" value={6917.4} sub="todas as abas somadas" color="#FFB347"/>
      <KPICard label="CARTÃO (ciclo)" value={2143.8} sub="2 cartão(ões) ativo(s)" color="#B07AFF"/>
      <KPICard label="PATRIMÔNIO" value={184320} sub="investimentos registrados" color="#10F5A3"/>
    </div>

    {/* Donut + Bars */}
    <div className="grid-7-5" style={{ marginTop: 18 }}>
      <div className="gf-card">
        <div className="gf-card-title">Despesas por Categoria</div>
        <DonutChart/>
      </div>
      <div className="gf-card">
        <div className="gf-card-title">Evolução Mensal</div>
        <BarChart/>
      </div>
    </div>

    {/* Abas + Divisão */}
    <div className="grid-3-2" style={{ marginTop: 18 }}>
      <div>
        <SectionH color="#10F5A3">Despesas por Aba</SectionH>
        <AbaBar nome="🍽️ Alimentação" valor={1642.3} pctRend={19.5} cor="#FF4B6E"/>
        <AbaBar nome="🏠 Moradia"     valor={2800.0} pctRend={33.3} cor="#B07AFF"/>
        <AbaBar nome="👨‍👩‍👧 Familiar" valor={1240.0} pctRend={14.8} cor="#6FA9D6"/>
        <AbaBar nome="🎮 Lazer"        valor={520.0}  pctRend={6.2}  cor="#F4A261"/>

        <SectionH color="#B07AFF">Próximos Vencimentos</SectionH>
        <div className="venc-grid">
          <VencCard aba="🏠 Moradia"   desc="Aluguel"   dia={5}  valor={2200} cor="#FFB347"/>
          <VencCard aba="📱 Telecom"   desc="Internet"  dia={12} valor={119.9} cor="#10F5A3"/>
          <VencCard aba="🎓 Educação"  desc="Faculdade" dia={15} valor={890}   cor="#10F5A3"/>
          <VencCard aba="🎬 Streaming" desc="Netflix"   dia={22} valor={39.9}  cor="#10F5A3"/>
        </div>
      </div>
      <div>
        <SectionH color="#FFB347">Divisão de Gastos</SectionH>
        <DivisaoCard nome="Lili" valor={234.5} cor="#B07AFF" lado="te-deve"/>
        <DivisaoCard nome="Pedro" valor={87.2}  cor="#6FA9D6" lado="te-deve"/>
        <DivisaoCard nome="Mãe"   valor={140.0} cor="#FF8A5C" lado="voce-deve"/>

        <SectionH color="#6FA9D6">Patrimônio</SectionH>
        <PatrRow cat="Renda Fixa" valor={92160} pct={50}/>
        <PatrRow cat="Ações"      valor={56000} pct={30}/>
        <PatrRow cat="FIIs"       valor={27640} pct={15}/>
        <PatrRow cat="Cripto"     valor={8520}  pct={5}/>
      </div>
    </div>
  </>
);

// ─────────────────────────────────────────────────────────────────────
// PAGE: Cartão de Crédito — chip strip + 3 tabs
// ─────────────────────────────────────────────────────────────────────
const CartaoPage = () => {
  const cartoes = [
    { id: 1, nome: 'Nubank', finalDigitos: '9477', cor: '#8A05BE', limite: 5900 },
    { id: 2, nome: 'Itaú',   finalDigitos: '2138', cor: '#FF6B00', limite: 3800 },
    { id: 3, nome: 'C6',     finalDigitos: '5512', cor: '#FFD700', limite: 2500 },
  ];
  const [selected, setSelected] = React.useState(0); // 0 = todos
  const [tab, setTab] = React.useState('acomp');

  return (
    <>
      <PageHeader
        title={<><span style={{ marginRight: 10 }}>💳</span>Cartão de Crédito</>}
        subtitle="Análise de faturas via IA · Acompanhamento do ciclo em aberto · Tendências"
      />

      <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
        <BankChip name="🗂 Todos" color="#10F5A3" active={selected === 0} onClick={() => setSelected(0)}/>
        {cartoes.map((c, i) => (
          <BankChip
            key={c.id}
            name={c.nome}
            finalDigits={c.finalDigitos}
            color={c.cor}
            active={selected === i + 1}
            onClick={() => setSelected(i + 1)}
          />
        ))}
      </div>

      <Tabs
        tabs={[
          { id: 'acomp', label: '📅 Acompanhamento do Mês' },
          { id: 'hist',  label: '🕓 Histórico & Análise' },
          { id: 'trend', label: '📈 Tendências' },
        ]}
        active={tab}
        onChange={setTab}
      />

      <div style={{ paddingTop: 18 }}>
        {tab === 'acomp' && <TabAcomp cartao={selected === 0 ? null : cartoes[selected - 1]}/>}
        {tab === 'hist'  && <TabHistorico cartao={selected === 0 ? null : cartoes[selected - 1]}/>}
        {tab === 'trend' && <TabTendencias/>}
      </div>
    </>
  );
};

// ── Tab: Acompanhamento ─────────────────────────────────────────────
const TabAcomp = ({ cartao }) => {
  const limite = cartao?.limite ?? 12200;
  const gasto  = cartao ? cartao.limite * 0.36 : 4380;
  return (
    <>
      <div className="ciclo-strip">
        <div>
          <div className="strip-label">Ciclo aberto</div>
          <div className="strip-value">03/05/2026 → 02/06/2026</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div className="strip-label">Limite</div>
          <div className="strip-value">{fmtBRL(limite)}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="strip-label">Dia 13 de 30</div>
          <div className="strip-value" style={{ color: '#10F5A3' }}>17 dias restantes</div>
        </div>
      </div>

      <SectionH color="#10F5A3">Limite do Ciclo</SectionH>
      <BigProgress gasto={gasto} limite={limite} updated="14:22 · 12/05/2026"/>

      <div style={{ marginTop: 16 }}>
        <GlowKPI
          title="Indicadores do Ciclo"
          items={[
            { label: 'Pace', value: 'No ritmo', color: '#10F5A3', sub: `gasto ${((gasto/limite)*100).toFixed(0)}% · tempo 43%` },
            { label: 'Forecast fechamento', value: fmtBRL(gasto * 30 / 13), color: '#10F5A3', sub: `${((gasto * 30 / 13 / limite) * 100).toFixed(0)}% do limite` },
            { label: 'Pode gastar/dia', value: fmtBRL((limite - gasto) / 17), sub: 'nos próximos 17 dias' },
            { label: 'Ritmo atual', value: fmtBRL(gasto / 13), sub: 'por dia decorrido' },
            { label: 'Transações', value: '38' },
          ]}
        />
      </div>

      <SectionH color="#B07AFF">Gastos por Categoria no Ciclo</SectionH>
      <ProgressCategorias
        color="#B07AFF"
        items={[
          { categoria: 'Alimentação', valor: gasto*0.32, pct: 32.0, qtd: 18, color: '#FF4B6E' },
          { categoria: 'Compras',     valor: gasto*0.24, pct: 24.0, qtd: 7,  color: '#FF8A5C' },
          { categoria: 'Transporte',  valor: gasto*0.18, pct: 18.0, qtd: 12, color: '#6FA9D6' },
          { categoria: 'Assinaturas', valor: gasto*0.14, pct: 14.0, qtd: 5,  color: '#B07AFF' },
          { categoria: 'Lazer',       valor: gasto*0.12, pct: 12.0, qtd: 6,  color: '#F4A261' },
        ]}
      />
    </>
  );
};

// ── Tab: Histórico ──────────────────────────────────────────────────
const TabHistorico = ({ cartao }) => (
  <>
    <SectionH>Histórico (8 faturas · 312 transações)</SectionH>
    <ExecSummary>
      A fatura veio <b>12% acima da média</b> dos últimos 3 meses. O aumento concentra-se em <b>Alimentação</b> (+R$ 320) e <b>Compras</b> (+R$ 180). Há um parcelamento longo novo na Magalu que vai aparecer pelas próximas 8 faturas.
    </ExecSummary>

    <SectionH>Alertas (3)</SectionH>
    <AlertLine text={<>Gasto atípico em <b style={{color:'#E8ECF2'}}>iFood</b> — 3.2× a média semanal.</>} value="R$ 412,50" level="warn"/>
    <AlertLine text={<>Parcelamento longo detectado: <b style={{color:'#E8ECF2'}}>Magalu</b> em 12× restando 8.</>} value="R$ 218,00 / mês" level="parcela"/>
    <AlertLine text={<>Possível duplicidade em <b style={{color:'#E8ECF2'}}>Uber</b> — duas cobranças idênticas no mesmo dia.</>} value="R$ 24,80" level="danger"/>

    <SectionH color="#B07AFF">Gastos por Categoria</SectionH>
    <ProgressCategorias
      color="#B07AFF"
      items={[
        { categoria: 'Alimentação', valor: 1642.3, pct: 28.4, qtd: 42, color: '#FF4B6E' },
        { categoria: 'Assinaturas', valor: 1045.2, pct: 18.1, qtd: 9,  color: '#B07AFF' },
        { categoria: 'Compras',     valor: 945.0,  pct: 16.3, qtd: 11, color: '#FF8A5C' },
        { categoria: 'Transporte',  valor: 731.8,  pct: 12.7, qtd: 18, color: '#6FA9D6' },
        { categoria: 'Lazer',       valor: 542.4,  pct: 9.4,  qtd: 14, color: '#F4A261' },
      ]}
    />
  </>
);

// ── Tab: Tendências ────────────────────────────────────────────────
const TabTendencias = () => (
  <>
    <GlowKPI
      title="Resumo de Tendências"
      items={[
        { label: 'Mês atual', value: '2026-05', sub: fmtBRL(5781) },
        { label: 'Mês anterior', value: '2026-04', sub: fmtBRL(5132) },
        { label: 'Variação', value: <span style={{ color: '#FF6B7A' }}>▲ {fmtBRL(649)}</span>, sub: '+12.6%' },
        { label: 'Soma acumulada', value: fmtBRL(43210), sub: '312 transações' },
      ]}
    />
    <SectionH>Evolução mensal de gastos</SectionH>
    <div className="gf-card" style={{ marginBottom: 14, height: 220, display:'flex', alignItems:'center', justifyContent:'center', color:'#4E5768', fontSize:13 }}>
      [ Plotly line chart com glow verde · charts.line_evolucao_mensal() ]
    </div>
    <SectionH>Composição mensal por categoria</SectionH>
    <div className="gf-card" style={{ height: 220, display:'flex', alignItems:'center', justifyContent:'center', color:'#4E5768', fontSize:13 }}>
      [ Plotly stacked bars · charts.stacked_categorias_mensal() ]
    </div>
  </>
);

// ─────────────────────────────────────────────────────────────────────
// Generic "page coming" placeholder
// ─────────────────────────────────────────────────────────────────────
const PlaceholderPage = ({ icon, title, blurb }) => (
  <>
    <PageHeader title={<><span style={{ marginRight: 10 }}>{icon}</span>{title}</>} subtitle="Maio 2026"/>
    <div className="af-card" style={{ padding: '60px 32px', textAlign: 'center' }}>
      <div style={{ fontSize: 14, color: '#8B92A0', lineHeight: 1.7, maxWidth: 480, margin: '0 auto' }}>{blurb}</div>
    </div>
  </>
);

const RendimentosPage = () => (
  <PlaceholderPage icon="💰" title="Rendimentos"
    blurb={<>Lançamento de receitas por categoria (<b style={{color:'#E8ECF2'}}>Salário, Aluguel, Freelas, Dividendos, Outros</b>) com edição inline e recorrência automática que propaga o lançamento para N meses futuros. Donut por categoria + histórico 12 meses.</>}/>
);
const DespesasPage = () => (
  <PlaceholderPage icon="📅" title="Despesas"
    blurb={<>Abas configuráveis com membros por aba. Lançar na aba <b style={{color:'#E8ECF2'}}>Familiar</b> faz <b style={{color:'#10F5A3'}}>split automático</b> entre os membros e lança sua cota na aba Pessoal. Parcelamento em N meses, recorrência, orçamentos com barras de progresso, visão anual 12m × categorias.</>}/>
);
const InvestPage = () => (
  <PlaceholderPage icon="📈" title="Investimentos"
    blurb={<>Snapshot mensal de patrimônio por categoria (Renda Fixa, Tesouro Direto, Ações BR, BDR/ETF, FIIs, Cripto, Previdência, CDB/LCI/LCA, Outros). Histórico <b style={{color:'#E8ECF2'}}>imutável</b> — só o mês atual é editável. Donut de distribuição + linha de evolução.</>}/>
);
const ConfigPage = () => (
  <PlaceholderPage icon="⚙️" title="Configurações"
    blurb={<>Pessoas · Abas de Despesa · Regras Fixas · Categorias · Cartões · Ciclo de fechamento. Tudo o que define o seu setup.</>}/>
);

// ── Page header ──────────────────────────────────────────────────────
const PageHeader = ({ title, subtitle }) => (
  <div style={{ padding: '2px 0 16px', display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
    <div style={{ fontSize: 22, fontWeight: 800, color: '#E8ECF2', letterSpacing: '-0.5px', whiteSpace: 'nowrap' }}>
      {title}
    </div>
    {subtitle && <div style={{ fontSize: 13, color: '#4E5768', fontWeight: 600, whiteSpace: 'nowrap' }}>{subtitle}</div>}
  </div>
);

// ─────────────────────────────────────────────────────────────────────
// Small helpers used inside Visão Geral
// ─────────────────────────────────────────────────────────────────────
const AbaBar = ({ nome, valor, pctRend, cor }) => {
  const corBar = pctRend < 15 ? '#10F5A3' : pctRend < 30 ? '#FFB347' : '#FF6B7A';
  const w = Math.max(3, Math.min(100, pctRend));
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: 13, color: '#C8CDD6', marginBottom: 4 }}>
        <span style={{ fontWeight: 600 }}>{nome}</span>
        <span style={{ color: cor, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{fmtBRL(valor)}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 10.5, color: '#4E5768', marginBottom: 5 }}>
        <span>{pctRend.toFixed(0)}% da receita</span>
      </div>
      <div style={{ background: '#1A2030', borderRadius: 4, height: 5, overflow: 'hidden' }}>
        <div style={{ background: corBar, width: `${w}%`, height: 5, borderRadius: 4, boxShadow: `0 0 6px ${corBar}55` }}/>
      </div>
    </div>
  );
};

const VencCard = ({ aba, desc, dia, valor, cor }) => (
  <div className="af-card venc-card" style={{ borderTop: `2px solid ${cor}33` }}>
    <div className="venc-aba">{aba}</div>
    <div className="venc-desc">{desc}</div>
    <div className="venc-dia" style={{ color: cor }}>dia {dia}</div>
    <div className="venc-val">{fmtBRL(valor)}</div>
  </div>
);

const DivisaoCard = ({ nome, valor, cor, lado }) => {
  const positivo = lado === 'te-deve';
  const c = positivo ? '#10F5A3' : '#FF6B7A';
  return (
    <div className="af-card" style={{ borderLeft: '3px solid #FFB347', padding: '12px 18px', marginBottom: 6 }}>
      <div style={{ color: '#C8CDD6', fontSize: 13.5 }}>
        {positivo
          ? <><b style={{ color: cor }}>{nome}</b> te deve <b style={{ color: c }}>{fmtBRL(valor)}</b></>
          : <>Você deve <b style={{ color: cor }}>{nome}</b> <b style={{ color: c }}>{fmtBRL(valor)}</b></>
        }
      </div>
      <div style={{ fontSize: 10.5, color: '#4E5768', marginTop: 4 }}>Maio 2026</div>
    </div>
  );
};

const PatrRow = ({ cat, valor, pct }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, color: '#C8CDD6', padding: '3px 0' }}>
    <span>{cat}</span>
    <span style={{ color: '#6FA9D6', fontVariantNumeric: 'tabular-nums' }}>{fmtBRL(valor)} <span style={{ color: '#4E5768' }}>({pct}%)</span></span>
  </div>
);

// ─────────────────────────────────────────────────────────────────────
// Mini static charts (donut & bar) — visual parity, not real charts
// ─────────────────────────────────────────────────────────────────────
const DonutChart = () => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 24, padding: '10px 6px' }}>
    <div style={{ position: 'relative', width: 200, height: 200 }}>
      <svg viewBox="0 0 36 36" width="200" height="200">
        <circle cx="18" cy="18" r="14" fill="none" stroke="#0B0E13" strokeWidth="6"/>
        <circle cx="18" cy="18" r="14" fill="none" stroke="#FF4B6E" strokeWidth="6" strokeDasharray="25 88" transform="rotate(-90 18 18)"/>
        <circle cx="18" cy="18" r="14" fill="none" stroke="#B07AFF" strokeWidth="6" strokeDasharray="16 88" strokeDashoffset="-25" transform="rotate(-90 18 18)"/>
        <circle cx="18" cy="18" r="14" fill="none" stroke="#6FA9D6" strokeWidth="6" strokeDasharray="13 88" strokeDashoffset="-41" transform="rotate(-90 18 18)"/>
        <circle cx="18" cy="18" r="14" fill="none" stroke="#F4A261" strokeWidth="6" strokeDasharray="10 88" strokeDashoffset="-54" transform="rotate(-90 18 18)"/>
        <circle cx="18" cy="18" r="14" fill="none" stroke="#5A6273" strokeWidth="6" strokeDasharray="24 88" strokeDashoffset="-64" transform="rotate(-90 18 18)"/>
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 10, color: '#8B92A0', letterSpacing: 1.5 }}>TOTAL</div>
        <div style={{ fontSize: 18, fontWeight: 800, color: '#E8ECF2', fontVariantNumeric: 'tabular-nums' }}>R$ 6.917</div>
      </div>
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12, color: '#C8CDD6' }}>
      {[
        ['#FF4B6E', 'Alimentação'],
        ['#B07AFF', 'Assinaturas'],
        ['#6FA9D6', 'Transporte'],
        ['#F4A261', 'Lazer'],
        ['#5A6273', 'Outros'],
      ].map(([c, l]) => (
        <span key={l} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 9, height: 9, borderRadius: 50, background: c }}/>{l}
        </span>
      ))}
    </div>
  </div>
);

const BarChart = () => (
  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 20, height: 220, padding: '10px 4px' }}>
    {[
      { m: 'Jan/26', r: 0.6, d: 0.5 },
      { m: 'Fev/26', r: 0.65, d: 0.54 },
      { m: 'Mar/26', r: 0.70, d: 0.60 },
      { m: 'Abr/26', r: 0.72, d: 0.58 },
      { m: 'Mai/26', r: 0.80, d: 0.70 },
      { m: 'Jun/26', r: 0.78, d: 0.66 },
    ].map((b, i) => (
      <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flex: 1 }}>
        <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end', height: 180 }}>
          <div style={{ width: 18, height: `${b.r * 100}%`, background: '#10F5A344', border: '1px solid #10F5A3', borderRadius: '2px 2px 0 0' }}/>
          <div style={{ width: 18, height: `${b.d * 100}%`, background: '#FF6B7A44', border: '1px solid #FF6B7A', borderRadius: '2px 2px 0 0' }}/>
        </div>
        <span style={{ fontSize: 10, color: '#4E5768', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{b.m}</span>
      </div>
    ))}
  </div>
);

Object.assign(window, { VisaoGeral, CartaoPage, RendimentosPage, DespesasPage, InvestPage, ConfigPage });
