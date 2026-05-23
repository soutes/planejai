// Sidebar — fixed 220px, near-black, nav rows with active state.
const Sidebar = ({ page, onPage, month, onMonth }) => {
  const NAV = [
    { id: 'visao_geral',  icon: IconHome,     label: 'Visão Geral' },
    { id: 'rendimentos',  icon: IconWallet,   label: 'Rendimentos' },
    { id: 'despesas',     icon: IconCalendar, label: 'Despesas' },
    { id: 'cartao',       icon: IconCard,     label: 'Cartão de Crédito' },
    { id: 'investimentos',icon: IconTrend,    label: 'Investimentos' },
  ];
  return (
    <aside className="kit-sidebar">
      <div className="kit-brand">
        <div className="kit-wm">planej<span className="kit-a">AÍ</span></div>
        <div className="kit-brand-tag">PLANEJAMENTO FINANCEIRO</div>
      </div>
      <div className="kit-month">
        <button className="kit-step" onClick={() => onMonth(-1)} aria-label="Mês anterior">
          <IconChevL size={14} color="#8B92A0"/>
        </button>
        <span className="kit-month-label">{month}</span>
        <button className="kit-step" onClick={() => onMonth(1)} aria-label="Próximo mês">
          <IconChevR size={14} color="#8B92A0"/>
        </button>
      </div>
      <div className="kit-divider"></div>
      {NAV.map(n => {
        const Icon = n.icon;
        const active = page === n.id;
        return (
          <button
            key={n.id}
            className={`kit-nav${active ? ' is-active' : ''}`}
            onClick={() => onPage(n.id)}
          >
            <Icon size={17} color={active ? '#10F5A3' : '#8B92A0'}/>
            <span>{n.label}</span>
          </button>
        );
      })}
      <div className="kit-divider"></div>
      <button
        className={`kit-nav${page === 'config' ? ' is-active' : ''}`}
        onClick={() => onPage('config')}
      >
        <IconSettings size={17} color={page === 'config' ? '#10F5A3' : '#8B92A0'}/>
        <span>Configurações</span>
      </button>
      <div style={{ flex: 1 }} />
      <button className="kit-nav kit-nav-quiet">
        <IconClose size={17} color="#6E7A8C"/>
        <span>Fechar App</span>
      </button>
    </aside>
  );
};

Object.assign(window, { Sidebar });
