# -*- coding: utf-8 -*-
import datetime
import os
import sys
import threading
import time
from pathlib import Path

import plotly.graph_objects as go
import streamlit as st

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT))

from src import database, ui
from src import database_acompanhamento as db_acomp
from src import database_gestao as db_g
from src import page_cartao, page_despesas, page_investimentos, page_rendimentos

# ── Escreve PID para o launcher monitorar ─────────────────────────────────────
_PID_FILE = ROOT / "data" / ".streamlit.pid"
_PID_FILE.parent.mkdir(parents=True, exist_ok=True)
_PID_FILE.write_text(str(os.getpid()))

st.set_page_config(
    page_title="planejAÍ",
    page_icon="💰",
    layout="wide",
    initial_sidebar_state="expanded",
)

ui.inject_css()
database.init_db()
db_acomp.init_db()
db_g.init_db()

# ── Session state ──────────────────────────────────────────────────────────────
if "page" not in st.session_state:
    st.session_state["page"] = "visao_geral"
if "mes_ref" not in st.session_state:
    st.session_state["mes_ref"] = datetime.date.today().replace(day=1)

mes_ref: datetime.date = st.session_state["mes_ref"]
mes_ref_str: str = mes_ref.strftime("%Y-%m")
_hoje1 = datetime.date.today().replace(day=1)

MESES_PT = {
    1: "Janeiro", 2: "Fevereiro", 3: "Março", 4: "Abril",
    5: "Maio", 6: "Junho", 7: "Julho", 8: "Agosto",
    9: "Setembro", 10: "Outubro", 11: "Novembro", 12: "Dezembro",
}
mes_label = f"{MESES_PT[mes_ref.month]} {mes_ref.year}"

# ── CSS ────────────────────────────────────────────────────────────────────────
st.markdown("""
<style>
/* ── Sidebar ── */
section[data-testid="stSidebar"] {
    background: #070B13 !important;
    border-right: 1px solid #1A2030;
    min-width: 220px !important;
    max-width: 220px !important;
}
section[data-testid="stSidebar"] > div:first-child { padding: 0 !important; }
section[data-testid="stSidebar"] .stButton > button {
    background: transparent !important;
    border: none !important;
    color: #6E7A8C !important;
    text-align: left !important;
    font-size: 13.5px !important;
    padding: 9px 18px !important;
    border-radius: 8px !important;
    width: 100% !important;
    margin: 1px 0 !important;
    justify-content: flex-start !important;
    font-weight: 500 !important;
    box-shadow: none !important;
    letter-spacing: 0.1px !important;
}
section[data-testid="stSidebar"] .stButton > button:hover {
    background: #131B28 !important;
    color: #C8CDD6 !important;
}
section[data-testid="stSidebar"] .stButton > button[kind="primary"] {
    background: #10F5A314 !important;
    color: #10F5A3 !important;
    border-left: 3px solid #10F5A3 !important;
    padding-left: 15px !important;
    font-weight: 700 !important;
}
section[data-testid="stSidebar"] .stButton > button[kind="primary"]:hover {
    background: #10F5A31E !important;
}
section[data-testid="stSidebar"] [data-testid="stVerticalBlock"] { gap: 0 !important; }

/* ── KPI cards ── */
.gf-kpi {
    background: linear-gradient(135deg, #0D1420, #111827);
    border: 1px solid #1A2030;
    border-radius: 14px;
    padding: 18px 20px 16px 20px;
}
.gf-kpi-label {
    font-size: 10.5px; letter-spacing: 1px; text-transform: uppercase;
    color: #4E5768; font-weight: 700; margin-bottom: 8px;
}
.gf-kpi-value { font-size: 23px; font-weight: 800; color: #E8ECF2;
    letter-spacing: -0.5px; line-height: 1; }
.gf-kpi-sub { font-size: 11px; color: #4E5768; margin-top: 5px; }

/* ── Card ── */
.gf-card {
    background: linear-gradient(135deg, #0D1420, #111827);
    border: 1px solid #1A2030;
    border-radius: 14px;
    padding: 18px 22px 16px 22px;
    height: 100%;
}
.gf-card-title {
    font-size: 13px; font-weight: 700; color: #C8CDD6;
    margin-bottom: 8px; display: flex; align-items: center; gap: 8px;
}
.gf-section-label {
    font-size: 10px; letter-spacing: 1.2px; text-transform: uppercase;
    color: #4E5768; font-weight: 700; margin: 12px 0 5px 0;
}
.gf-line {
    display: flex; justify-content: space-between; align-items: center;
    padding: 3px 0; font-size: 13px; color: #C8CDD6;
}
.gf-badge-ex {
    display: inline-block; font-size: 9px; letter-spacing: 0.8px;
    background: #B07AFF1A; color: #B07AFF; border: 1px solid #B07AFF33;
    border-radius: 4px; padding: 1px 6px; margin-left: 8px;
    vertical-align: middle; font-weight: 600;
}
</style>
""", unsafe_allow_html=True)


# ══════════════════════════════════════════════════════════════════════════════
# SIDEBAR
# ══════════════════════════════════════════════════════════════════════════════
NAV = [
    ("visao_geral",   "🏠", "Visão Geral"),
    ("rendimentos",   "💰", "Rendimentos"),
    ("despesas",      "📅", "Despesas"),
    ("cartao",        "💳", "Cartão de Crédito"),
    ("investimentos", "📈", "Investimentos"),
]

with st.sidebar:
    st.markdown(
        '<div style="padding:24px 18px 16px 18px;">'
        '<div style="font-size:20px;font-weight:800;color:#E8ECF2;letter-spacing:-0.5px;">'
        'planej<span style="color:#10F5A3;">AÍ</span></div>'
        '<div style="font-size:10.5px;color:#4E5768;margin-top:1px;letter-spacing:0.5px;">'
        'PLANEJAMENTO FINANCEIRO</div>'
        '</div>',
        unsafe_allow_html=True,
    )

    # Seletor de mês
    st.markdown('<div style="padding:0 8px 12px 8px;">', unsafe_allow_html=True)
    _p, _m, _n = st.columns([1, 4, 1])
    with _p:
        if st.button("◀", key="prev_mes", use_container_width=True):
            d = mes_ref
            st.session_state["mes_ref"] = (
                d.replace(day=1) - datetime.timedelta(days=1)
            ).replace(day=1)
            st.rerun()
    with _m:
        st.markdown(
            f'<div style="text-align:center;font-size:12px;font-weight:700;'
            f'color:#10F5A3;padding-top:8px;">{mes_label}</div>',
            unsafe_allow_html=True,
        )
    with _n:
        if st.button("▶", key="next_mes", use_container_width=True,
                     disabled=(mes_ref >= _hoje1)):
            d = mes_ref
            st.session_state["mes_ref"] = (
                d.replace(day=28) + datetime.timedelta(days=4)
            ).replace(day=1)
            st.rerun()
    st.markdown('</div>', unsafe_allow_html=True)

    st.divider()

    for page_id, icon, label in NAV:
        is_active = st.session_state["page"] == page_id
        if st.button(
            f"{icon}  {label}", key=f"nav_{page_id}",
            use_container_width=True,
            type="primary" if is_active else "secondary",
        ):
            st.session_state["page"] = page_id
            st.rerun()

    st.divider()
    if st.button(
        "⚙️  Configurações", key="nav_cfg", use_container_width=True,
        type="primary" if st.session_state["page"] == "configuracoes" else "secondary",
    ):
        st.session_state["page"] = "configuracoes"
        st.rerun()

    # Fechar app
    st.markdown('<div style="height:8px;"></div>', unsafe_allow_html=True)
    if st.button("✕  Fechar App", key="btn_fechar_sb", use_container_width=True):
        def _shutdown():
            time.sleep(0.3)
            try:
                _PID_FILE.unlink(missing_ok=True)
            except Exception:
                pass
            time.sleep(0.3)
            os._exit(0)
        threading.Thread(target=_shutdown, daemon=True).start()
        st.stop()


# ══════════════════════════════════════════════════════════════════════════════
# HELPERS
# ══════════════════════════════════════════════════════════════════════════════
_PAGE = st.session_state["page"]


def _kpi(label: str, value: str, sub: str, cor: str) -> None:
    st.markdown(
        f'<div class="gf-kpi" style="border-top:3px solid {cor};">'
        f'<div class="gf-kpi-label">{label}</div>'
        f'<div class="gf-kpi-value">{value}</div>'
        f'<div class="gf-kpi-sub">{sub}</div>'
        f'</div>',
        unsafe_allow_html=True,
    )


# ══════════════════════════════════════════════════════════════════════════════
# PAGE: VISÃO GERAL
# ══════════════════════════════════════════════════════════════════════════════
if _PAGE == "visao_geral":
    st.markdown(
        f'<div style="padding:2px 0 16px 0;display:flex;'
        f'align-items:baseline;gap:12px;">'
        f'<div style="font-size:22px;font-weight:800;color:#E8ECF2;">'
        f'Visão Geral</div>'
        f'<div style="font-size:13px;color:#4E5768;font-weight:600;">'
        f'{mes_label}</div>'
        f'</div>',
        unsafe_allow_html=True,
    )

    # Dados reais
    _total_rend = db_g.total_rendimentos(mes_ref_str)
    _total_desp = db_g.total_despesas_mes(mes_ref_str)
    _saldo_mes = _total_rend - _total_desp
    _total_patr = db_g.total_patrimonio(mes_ref_str)
    _saldos_div = db_g.saldo_divisao_por_pessoa(mes_ref_str)
    _div_total = sum(
        abs(s["saldo_liquido"]) for s in _saldos_div
        if s["saldo_liquido"] > 0
    )

    # Cartão: snapshot do ciclo atual (total do acompanhamento)
    _cartoes_all_vg = database.list_cartoes()
    _active_ids_vg = [c["id"] for c in _cartoes_all_vg if c["ativo"] and c["id"] != 1]
    _snap_vg = db_acomp.latest_snapshot_combined(valid_cartao_ids=_active_ids_vg)
    _total_cartao = float(_snap_vg.get("total") or 0) if _snap_vg else 0.0
    _n_cartoes = len(_active_ids_vg)

    # ── KPIs ──────────────────────────────────────────────────────────────────
    _k1, _k2, _k3, _k4, _k5 = st.columns(5, gap="medium")
    with _k1:
        cor_s = "#10F5A3" if _saldo_mes >= 0 else "#FF6B7A"
        _kpi("SALDO DO MÊS", ui.fmt_brl(_saldo_mes),
             f"receitas − despesas", cor_s)
    with _k2:
        _kpi("RENDIMENTOS", ui.fmt_brl(_total_rend),
             f"total recebido em {mes_label[:3]}", "#6FA9D6")
    with _k3:
        _kpi("DESPESAS", ui.fmt_brl(_total_desp),
             "todas as abas somadas", "#FFB347")
    with _k4:
        _kpi("CARTÃO (ciclo)", ui.fmt_brl(_total_cartao),
             f"{_n_cartoes} cartão(ões) ativo(s)", "#B07AFF")
    with _k5:
        _kpi("PATRIMÔNIO", ui.fmt_brl(_total_patr),
             "investimentos registrados", "#10F5A3")

    st.markdown('<div style="height:18px;"></div>', unsafe_allow_html=True)

    # ── Gráficos ──────────────────────────────────────────────────────────────
    _gc, _gm = st.columns([5, 7], gap="medium")

    # Donut — despesas por categoria (real)
    with _gc:
        st.markdown(
            '<div class="gf-card">'
            '<div class="gf-card-title">Despesas por Categoria</div>',
            unsafe_allow_html=True,
        )
        _cats_desp = db_g.despesas_por_categoria_mes(None, mes_ref_str)
        if _cats_desp:
            _cats_d = list(_cats_desp.keys())
            _vals_d = [_cats_desp[c] for c in _cats_d]
            _colors_d = ["#10F5A3", "#B07AFF", "#6FA9D6", "#FF6B7A",
                         "#FFB347", "#3A4458", "#00CC88", "#FF8C00"]
            fig_donut = go.Figure(go.Pie(
                labels=_cats_d, values=_vals_d, hole=0.62,
                marker=dict(colors=_colors_d[:len(_cats_d)]),
                textinfo="none",
                hovertemplate="%{label}<br><b>R$ %{value:,.2f}</b><br>%{percent}<extra></extra>",
            ))
            fig_donut.add_annotation(
                text=f"<b>{ui.fmt_brl(_total_desp)}</b>",
                x=0.5, y=0.5, showarrow=False,
                font=dict(size=13, color="#E8ECF2"),
            )
            fig_donut.update_layout(
                paper_bgcolor="rgba(0,0,0,0)",
                plot_bgcolor="rgba(0,0,0,0)",
                font=dict(color="#C8CDD6", size=12),
                showlegend=True,
                legend=dict(
                    orientation="v", bgcolor="rgba(0,0,0,0)",
                    font=dict(color="#8B92A0", size=11),
                    x=0.72, y=0.5, xanchor="left", yanchor="middle",
                ),
                margin=dict(t=8, b=8, l=0, r=80),
                height=270,
            )
            st.plotly_chart(fig_donut, use_container_width=True,
                            config={"displayModeBar": False}, key="vg_donut")
        else:
            st.markdown(
                '<div style="text-align:center;padding:60px 0;">'
                '<div style="color:#4E5768;font-size:13px;">'
                'Sem despesas registradas em ' + mes_label + '</div></div>',
                unsafe_allow_html=True,
            )
        st.markdown('</div>', unsafe_allow_html=True)

    # Barras — evolução mensal (real)
    with _gm:
        st.markdown(
            '<div class="gf-card">'
            '<div class="gf-card-title">Evolução Mensal</div>',
            unsafe_allow_html=True,
        )
        _hist_r = db_g.historico_rendimentos(6)
        MESES_ABREV = {1:"Jan",2:"Fev",3:"Mar",4:"Abr",5:"Mai",6:"Jun",
                       7:"Jul",8:"Ago",9:"Set",10:"Out",11:"Nov",12:"Dez"}

        def _ml_vg(mr: str) -> str:
            return f"{MESES_ABREV[int(mr[5:7])]}/{mr[2:4]}"

        if len(_hist_r) >= 2:
            _hm = [_ml_vg(h["mes_ref"]) for h in _hist_r]
            _hr = [float(h["total"]) for h in _hist_r]
            _hd = [
                db_g.total_despesas_mes(h["mes_ref"])
                for h in _hist_r
            ]
            _hs = [r - d for r, d in zip(_hr, _hd)]
            fig_bar = go.Figure()
            fig_bar.add_trace(go.Bar(
                name="Receitas", x=_hm, y=_hr,
                marker=dict(color="#10F5A344",
                            line=dict(color="#10F5A3", width=1.5)),
            ))
            fig_bar.add_trace(go.Bar(
                name="Despesas", x=_hm, y=_hd,
                marker=dict(color="#FF6B7A44",
                            line=dict(color="#FF6B7A", width=1.5)),
            ))
            fig_bar.add_trace(go.Scatter(
                name="Saldo", x=_hm, y=_hs,
                mode="lines+markers",
                line=dict(color="#FFB347", width=2.5, dash="dot"),
                marker=dict(size=7, color="#FFB347",
                            line=dict(color="#0D1420", width=2)),
            ))
            fig_bar.update_layout(
                paper_bgcolor="rgba(0,0,0,0)",
                plot_bgcolor="rgba(0,0,0,0)",
                font=dict(color="#C8CDD6", size=11),
                barmode="group", bargap=0.3, bargroupgap=0.05,
                showlegend=True,
                legend=dict(
                    orientation="h", bgcolor="rgba(0,0,0,0)",
                    font=dict(color="#8B92A0", size=11), y=-0.22,
                ),
                xaxis=dict(gridcolor="#1A2030", color="#4E5768",
                           linecolor="#1A2030"),
                yaxis=dict(
                    gridcolor="#1A2030", color="#4E5768", linecolor="#1A2030",
                    tickprefix="R$ ", tickformat=",.0f",
                ),
                margin=dict(t=8, b=50, l=80, r=10),
                height=270,
            )
            st.plotly_chart(fig_bar, use_container_width=True,
                            config={"displayModeBar": False}, key="vg_bar")
        else:
            st.markdown(
                '<div style="text-align:center;padding:60px 0;">'
                '<div style="color:#4E5768;font-size:13px;">'
                'Registre rendimentos e despesas para ver a evolução.</div></div>',
                unsafe_allow_html=True,
            )
        st.markdown('</div>', unsafe_allow_html=True)

    st.markdown('<div style="height:16px;"></div>', unsafe_allow_html=True)

    # ── Resumo rápido das abas + Divisão de gastos ────────────────────────────
    _col_abas, _col_div = st.columns([3, 2], gap="medium")

    with _col_abas:
        ui.section("Despesas por Aba", color="#10F5A3")
        _abas_vg = db_g.list_abas()
        if _abas_vg:
            for aba_vg in _abas_vg:
                _t_aba = db_g.total_despesas_aba_mes(aba_vg["id"], mes_ref_str)
                _pct_rend = (_t_aba / _total_rend * 100) if _total_rend > 0 else 0
                _cor_aba = aba_vg["cor"]
                _pct_c = min(_pct_rend, 100)
                _cor_bar = "#10F5A3" if _pct_rend < 50 else (
                    "#FFB347" if _pct_rend < 80 else "#FF6B7A"
                )
                st.markdown(
                    f'<div style="margin-bottom:14px;">'
                    f'<div style="display:flex;justify-content:space-between;'
                    f'font-size:13px;color:#C8CDD6;margin-bottom:5px;">'
                    f'<span>{aba_vg["icon"]} <b>{aba_vg["nome"]}</b></span>'
                    f'<span style="color:{_cor_aba};font-weight:700;">'
                    f'{ui.fmt_brl(_t_aba)}</span></div>'
                    f'<div style="display:flex;justify-content:space-between;'
                    f'font-size:10.5px;color:#4E5768;margin-bottom:4px;">'
                    f'<span>{_pct_rend:.0f}% da receita</span></div>'
                    f'<div style="background:#1A2030;border-radius:4px;height:5px;">'
                    f'<div style="background:{_cor_bar};width:{_pct_c:.0f}%;'
                    f'height:5px;border-radius:4px;'
                    f'box-shadow:0 0 6px {_cor_bar}55;"></div></div>'
                    f'</div>',
                    unsafe_allow_html=True,
                )
        else:
            st.markdown(
                '<div style="color:#4E5768;font-size:13px;padding:16px 0;">'
                'Configure as abas em ⚙️ Configurações.</div>',
                unsafe_allow_html=True,
            )

        # Próximos vencimentos (regras fixas)
        ui.section("Próximos Vencimentos", color="#B07AFF")
        _regras = db_g.list_regras_fixas()
        if _regras:
            _rv_all = [r for r in _regras if r.get("dia_vencimento")]
            _rv_sorted = sorted(_rv_all, key=lambda r: r["dia_vencimento"])[:6]
            _vc = st.columns(2, gap="small")
            for i, _rr in enumerate(_rv_sorted):
                cor_d = (
                    "#10F5A3"
                    if _rr["dia_vencimento"] > datetime.date.today().day
                    else "#FFB347"
                )
                with _vc[i % 2]:
                    st.markdown(
                        f'<div class="af-card" style="text-align:center;padding:12px 8px;'
                        f'border-top:2px solid {cor_d}33;margin-bottom:8px;">'
                        f'<div style="font-size:9.5px;color:#4E5768;margin-bottom:3px;">'
                        f'{_rr["aba_icon"]} {_rr["aba_nome"]}</div>'
                        f'<div style="font-size:12.5px;font-weight:600;color:#E8ECF2;">'
                        f'{_rr["descricao"]}</div>'
                        f'<div style="font-size:21px;font-weight:800;color:{cor_d};'
                        f'margin:5px 0;">dia {_rr["dia_vencimento"]}</div>'
                        f'<div style="font-size:12.5px;color:#C8CDD6;">'
                        f'{ui.fmt_brl(_rr["valor"])}</div>'
                        f'</div>',
                        unsafe_allow_html=True,
                    )
        else:
            st.markdown(
                '<div style="color:#4E5768;font-size:13px;">'
                'Sem regras fixas. Configure em ⚙️ Configurações.</div>',
                unsafe_allow_html=True,
            )

    with _col_div:
        # Divisão de gastos
        if _saldos_div:
            ui.section("Divisão de Gastos", color="#FFB347")
            for s in _saldos_div:
                if abs(s["saldo_liquido"]) < 0.01:
                    continue
                cor_s = "#10F5A3" if s["saldo_liquido"] > 0 else "#FF6B7A"
                texto = (
                    f'<b style="color:{s["cor"]}">{s["nome"]}</b> te deve '
                    f'<b style="color:{cor_s}">{ui.fmt_brl(abs(s["saldo_liquido"]))}</b>'
                    if s["saldo_liquido"] > 0
                    else
                    f'Você deve <b style="color:{s["cor"]}">{s["nome"]}</b> '
                    f'<b style="color:{cor_s}">{ui.fmt_brl(abs(s["saldo_liquido"]))}</b>'
                )
                st.markdown(
                    f'<div class="af-card" style="border-left:3px solid #FFB347;'
                    f'padding:12px 18px;margin-bottom:6px;">'
                    f'<div style="color:#C8CDD6;font-size:13.5px;">{texto}</div>'
                    f'<div style="font-size:10.5px;color:#4E5768;margin-top:4px;">'
                    f'{mes_label}</div>'
                    f'</div>',
                    unsafe_allow_html=True,
                )

        # Patrimônio rápido
        _dist_patr = db_g.distribuicao_investimentos(mes_ref_str)
        if _dist_patr:
            ui.section("Patrimônio", color="#6FA9D6")
            for d in _dist_patr[:5]:
                pct = (float(d["total"]) / _total_patr * 100) if _total_patr > 0 else 0
                st.markdown(
                    f'<div style="display:flex;justify-content:space-between;'
                    f'font-size:12.5px;color:#C8CDD6;padding:3px 0;">'
                    f'<span>{d["categoria"]}</span>'
                    f'<span style="color:#6FA9D6;">{ui.fmt_brl(float(d["total"]))} '
                    f'<span style="color:#4E5768;">({pct:.0f}%)</span></span>'
                    f'</div>',
                    unsafe_allow_html=True,
                )
            if len(_dist_patr) > 5:
                st.caption(f"+ {len(_dist_patr)-5} categorias")


# ══════════════════════════════════════════════════════════════════════════════
# PAGE: RENDIMENTOS
# ══════════════════════════════════════════════════════════════════════════════
elif _PAGE == "rendimentos":
    page_rendimentos.render(mes_ref_str)


# ══════════════════════════════════════════════════════════════════════════════
# PAGE: DESPESAS
# ══════════════════════════════════════════════════════════════════════════════
elif _PAGE == "despesas":
    page_despesas.render(mes_ref_str)


# ══════════════════════════════════════════════════════════════════════════════
# PAGE: CARTÃO DE CRÉDITO
# ══════════════════════════════════════════════════════════════════════════════
elif _PAGE == "cartao":
    page_cartao.render()


# ══════════════════════════════════════════════════════════════════════════════
# PAGE: INVESTIMENTOS
# ══════════════════════════════════════════════════════════════════════════════
elif _PAGE == "investimentos":
    page_investimentos.render(mes_ref_str)


# ══════════════════════════════════════════════════════════════════════════════
# PAGE: CONFIGURAÇÕES
# ══════════════════════════════════════════════════════════════════════════════
elif _PAGE == "configuracoes":

    st.markdown(
        '<div style="font-size:22px;font-weight:800;color:#E8ECF2;'
        'padding-bottom:18px;">⚙️ Configurações</div>',
        unsafe_allow_html=True,
    )

    _t_pessoas, _t_abas, _t_regras, _t_cats, _t_cartoes, _t_ciclo = st.tabs([
        "👥 Pessoas",
        "📂 Abas de Despesa",
        "📌 Regras Fixas",
        "🏷️ Categorias",
        "💳 Cartões",
        "⏱️ Ciclo",
    ])

    # ── PESSOAS ───────────────────────────────────────────────────────────────
    with _t_pessoas:
        st.markdown("##### Pessoas para divisão de despesas")
        st.caption("Adicione as pessoas com quem divide gastos.")

        pessoas = db_g.list_pessoas()
        for p in pessoas:
            _pc1, _pc2, _pc3 = st.columns([4, 2, 1], gap="small")
            with _pc1:
                st.markdown(
                    f'<div style="display:flex;align-items:center;gap:10px;padding:6px 0;">'
                    f'<div style="width:14px;height:14px;border-radius:50%;'
                    f'background:{p["cor"]};flex-shrink:0;"></div>'
                    f'<span style="color:#E8ECF2;font-size:14px;">{p["nome"]}</span>'
                    f'</div>',
                    unsafe_allow_html=True,
                )
            with _pc2:
                novo_nome = st.text_input(
                    "Nome", value=p["nome"], key=f"pnome_{p['id']}",
                    label_visibility="collapsed",
                )
            with _pc3:
                if st.button("🗑️", key=f"pdel_{p['id']}", help="Remover"):
                    db_g.deactivate_pessoa(p["id"])
                    st.rerun()
            if novo_nome.strip() and novo_nome.strip() != p["nome"]:
                db_g.update_pessoa(p["id"], novo_nome.strip(), p["cor"])
                st.rerun()

        st.divider()
        st.markdown("**Adicionar pessoa**")
        _np1, _np2, _np3 = st.columns([3, 2, 1], gap="small")
        with _np1:
            _nova_pessoa = st.text_input("Nome", key="nova_pessoa_nome",
                                          placeholder="ex: Lili",
                                          label_visibility="collapsed")
        with _np2:
            _nova_cor = st.color_picker("Cor", value="#B07AFF",
                                         key="nova_pessoa_cor",
                                         label_visibility="collapsed")
        with _np3:
            if st.button("＋ Adicionar", key="btn_add_pessoa",
                          use_container_width=True):
                if _nova_pessoa.strip():
                    db_g.add_pessoa(_nova_pessoa.strip(), _nova_cor)
                    st.rerun()
                else:
                    st.warning("Digite o nome.")

    # ── ABAS DE DESPESA ───────────────────────────────────────────────────────
    with _t_abas:
        st.markdown("##### Abas de despesa")
        st.caption("Configure os grupos de gastos e quem divide cada aba.")

        abas = db_g.list_abas()
        pessoas_all = db_g.list_pessoas()
        cats_all = db_g.nomes_categorias()

        for aba in abas:
            with st.expander(f"{aba['icon']} {aba['nome']}", expanded=False):
                _a1, _a2, _a3 = st.columns([2, 2, 1], gap="small")
                with _a1:
                    _an = st.text_input("Nome", value=aba["nome"],
                                         key=f"anom_{aba['id']}")
                with _a2:
                    _dest_opts = ["(nenhum)"] + cats_all
                    _dest_idx = (
                        _dest_opts.index(aba["split_destino_categoria"])
                        if aba["split_destino_categoria"] in _dest_opts else 0
                    )
                    _dest = st.selectbox(
                        "Split → categoria Pessoal", _dest_opts,
                        index=_dest_idx, key=f"adest_{aba['id']}",
                    )
                with _a3:
                    _acor = st.color_picker(
                        "Cor", value=aba["cor"],
                        key=f"acor_{aba['id']}",
                        label_visibility="collapsed",
                    )

                if pessoas_all:
                    st.markdown("**Pessoas nesta aba**")
                    aba_pessoa_ids = {ap["pessoa_id"]: ap["ratio_default"]
                                      for ap in aba["pessoas"]}
                    novos_splits: list[dict] = []
                    _cols_p = st.columns(min(len(pessoas_all), 3), gap="small")
                    for idx_p, pessoa in enumerate(pessoas_all):
                        with _cols_p[idx_p % 3]:
                            _checked = st.checkbox(
                                pessoa["nome"],
                                value=pessoa["id"] in aba_pessoa_ids,
                                key=f"apcheck_{aba['id']}_{pessoa['id']}",
                            )
                            if _checked:
                                _ratio = st.number_input(
                                    "%", min_value=1, max_value=100,
                                    value=int(
                                        (aba_pessoa_ids.get(pessoa["id"], 0.5)) * 100
                                    ),
                                    key=f"apratio_{aba['id']}_{pessoa['id']}",
                                )
                                novos_splits.append({
                                    "pessoa_id": pessoa["id"],
                                    "ratio_default": _ratio / 100,
                                })

                _sa1, _sa2 = st.columns([1, 1], gap="small")
                with _sa1:
                    if st.button("💾 Salvar", key=f"asave_{aba['id']}",
                                  use_container_width=True):
                        dest_val = None if _dest == "(nenhum)" else _dest
                        db_g.update_aba(aba["id"], _an, aba["icon"],
                                        _acor, dest_val)
                        if pessoas_all:
                            db_g.set_aba_pessoas(aba["id"], novos_splits)
                        st.success("Salvo!")
                        st.rerun()
                with _sa2:
                    if st.button("🗑️ Remover", key=f"adel_{aba['id']}",
                                  use_container_width=True):
                        db_g.deactivate_aba(aba["id"])
                        st.rerun()

        st.divider()
        st.markdown("**Nova aba**")
        _na1, _na2, _na3 = st.columns([3, 2, 1], gap="small")
        with _na1:
            _nova_aba = st.text_input("Nome", key="nova_aba_nome",
                                       placeholder="ex: Familiar",
                                       label_visibility="collapsed")
        with _na2:
            _nova_aba_dest = st.selectbox(
                "Split → categoria", ["(nenhum)"] + cats_all,
                key="nova_aba_dest", label_visibility="collapsed",
            )
        with _na3:
            if st.button("＋ Criar", key="btn_add_aba", use_container_width=True):
                if _nova_aba.strip():
                    dest = None if _nova_aba_dest == "(nenhum)" else _nova_aba_dest
                    db_g.add_aba(_nova_aba.strip(), split_destino_categoria=dest)
                    st.rerun()
                else:
                    st.warning("Digite o nome.")

    # ── REGRAS FIXAS ──────────────────────────────────────────────────────────
    with _t_regras:
        st.markdown("##### Regras de despesas fixas")
        st.caption("Despesas que se repetem todo mês.")

        abas_ativas = db_g.list_abas()
        cats_nomes = db_g.nomes_categorias()
        regras = db_g.list_regras_fixas()

        if regras:
            abas_com_regra: dict[str, list] = {}
            for r in regras:
                abas_com_regra.setdefault(r["aba_nome"], []).append(r)
            for aba_nome, lista in abas_com_regra.items():
                st.markdown(f"**{aba_nome}**")
                for r in lista:
                    _r1, _r2, _r3, _r4, _r5 = st.columns([3, 2, 1, 1, 1],
                                                            gap="small")
                    with _r1:
                        _rdesc = st.text_input(
                            "Desc", value=r["descricao"],
                            key=f"rdesc_{r['id']}",
                            label_visibility="collapsed",
                        )
                    with _r2:
                        _rcat = st.selectbox(
                            "Cat", cats_nomes,
                            index=(cats_nomes.index(r["categoria"])
                                   if r["categoria"] in cats_nomes else 0),
                            key=f"rcat_{r['id']}",
                            label_visibility="collapsed",
                        )
                    with _r3:
                        _rval = st.number_input(
                            "R$", value=float(r["valor"]),
                            min_value=0.0, step=10.0, format="%.2f",
                            key=f"rval_{r['id']}",
                            label_visibility="collapsed",
                        )
                    with _r4:
                        _rdia = st.number_input(
                            "Dia", value=int(r["dia_vencimento"] or 1),
                            min_value=1, max_value=31,
                            key=f"rdia_{r['id']}",
                            label_visibility="collapsed",
                        )
                    with _r5:
                        _rc1, _rc2 = st.columns(2)
                        with _rc1:
                            if st.button("💾", key=f"rsave_{r['id']}"):
                                db_g.update_regra_fixa(r["id"], _rdesc, _rcat,
                                                       _rval, _rdia)
                                st.rerun()
                        with _rc2:
                            if st.button("🗑️", key=f"rdel_{r['id']}"):
                                db_g.deactivate_regra_fixa(r["id"])
                                st.rerun()
        else:
            st.info("Nenhuma regra fixa cadastrada.")

        st.divider()
        st.markdown("**Adicionar regra fixa**")
        _rf1, _rf2, _rf3, _rf4, _rf5 = st.columns([2, 2, 2, 1, 1], gap="small")
        with _rf1:
            _nr_aba = st.selectbox(
                "Aba", [a["nome"] for a in abas_ativas],
                key="nr_aba", label_visibility="collapsed",
            )
        with _rf2:
            _nr_desc = st.text_input("Descrição", key="nr_desc",
                                      placeholder="ex: Internet",
                                      label_visibility="collapsed")
        with _rf3:
            _nr_cat = st.selectbox("Categoria", cats_nomes,
                                    key="nr_cat", label_visibility="collapsed")
        with _rf4:
            _nr_val = st.number_input("R$", min_value=0.0, step=10.0,
                                       format="%.2f", key="nr_val",
                                       label_visibility="collapsed")
        with _rf5:
            _nr_dia = st.number_input("Dia", min_value=1, max_value=31,
                                       value=1, key="nr_dia",
                                       label_visibility="collapsed")
        if st.button("＋ Adicionar regra", key="btn_add_regra"):
            if _nr_desc.strip() and _nr_val > 0:
                aba_obj = next((a for a in abas_ativas if a["nome"] == _nr_aba), None)
                if aba_obj:
                    db_g.add_regra_fixa(aba_obj["id"], _nr_desc.strip(),
                                        _nr_cat, _nr_val, _nr_dia)
                    st.rerun()
            else:
                st.warning("Preencha descrição e valor.")

    # ── CATEGORIAS ────────────────────────────────────────────────────────────
    with _t_cats:
        st.markdown("##### Categorias de despesa")
        cats = db_g.list_categorias()
        padrao = [c for c in cats if c["padrao"]]
        custom = [c for c in cats if not c["padrao"]]

        st.markdown("**Padrão** (não removíveis)")
        _pg = st.columns(4)
        for i, c in enumerate(padrao):
            with _pg[i % 4]:
                st.markdown(
                    f'<div style="background:#0D1420;border:1px solid #1A2030;'
                    f'border-radius:8px;padding:8px 12px;margin-bottom:6px;'
                    f'font-size:13px;color:#6E7A8C;">'
                    f'{c["icon"]} {c["nome"]}</div>',
                    unsafe_allow_html=True,
                )
        if custom:
            st.markdown("**Customizadas**")
            for c in custom:
                _cc1, _cc2 = st.columns([5, 1], gap="small")
                with _cc1:
                    st.markdown(
                        f'<div style="background:#0D1420;border:1px solid #1A2030;'
                        f'border-radius:8px;padding:8px 12px;'
                        f'font-size:13px;color:#C8CDD6;">'
                        f'{c["icon"]} {c["nome"]}</div>',
                        unsafe_allow_html=True,
                    )
                with _cc2:
                    if st.button("🗑️", key=f"cdel_{c['id']}"):
                        db_g.deactivate_categoria(c["id"])
                        st.rerun()

        st.divider()
        st.markdown("**Nova categoria**")
        _nc1, _nc2, _nc3 = st.columns([3, 1, 2], gap="small")
        with _nc1:
            _nc_nome = st.text_input("Nome", key="nc_nome",
                                      placeholder="ex: Academia",
                                      label_visibility="collapsed")
        with _nc2:
            _nc_icon = st.text_input("Ícone", value="📌", key="nc_icon",
                                      label_visibility="collapsed", max_chars=2)
        with _nc3:
            _nc_perm = st.radio("Duração",
                                 ["Permanente", "Só este mês"],
                                 key="nc_perm", horizontal=True,
                                 label_visibility="collapsed")
        if st.button("＋ Criar categoria", key="btn_add_cat"):
            if _nc_nome.strip():
                db_g.add_categoria(_nc_nome.strip(), _nc_icon,
                                   permanente=(_nc_perm == "Permanente"))
                st.rerun()
            else:
                st.warning("Digite o nome.")

    # ── CARTÕES ───────────────────────────────────────────────────────────────
    with _t_cartoes:
        st.markdown("##### Cartões de crédito")
        st.caption(
            "Cartões usados no módulo Cartão de Crédito. "
            "Adicionar, editar e remover cartões aqui."
        )

        def _banco_cor_cfg(nome: str) -> str:
            _BC = {
                "itau":"#FF6B00","itaú":"#FF6B00","nubank":"#8A05BE",
                "bradesco":"#CC0000","santander":"#EC0000","caixa":"#006CB5",
                "inter":"#FF7A00","c6":"#FFD700","btg":"#003B70",
                "xp":"#1C1C1C","picpay":"#21C25E","next":"#00FF88",
                "pan":"#0070CC","original":"#00C06B","neon":"#7B2FBE",
            }
            n = nome.lower()
            for k, v in _BC.items():
                if k in n:
                    return v
            return "#10F5A3"

        _dlg_cartoes = [c for c in database.list_cartoes() if c.get("id") != 1]

        if not _dlg_cartoes:
            st.info("Nenhum cartão cadastrado ainda.")
        else:
            for _c in _dlg_cartoes:
                _cid = _c["id"]
                _orig_nome  = _c["nome"] or ""
                _orig_final = _c.get("final_digitos") or ""
                _orig_prop  = _c.get("proprietario") or ""
                _orig_lim   = float(_c.get("limite") or 0.0)
                _orig_cor   = _c.get("cor") or "#10F5A3"

                st.markdown(
                    f'<div style="display:flex;align-items:center;gap:8px;'
                    f'margin:14px 0 10px 0;">'
                    f'<div style="width:10px;height:10px;border-radius:50%;'
                    f'background:{_orig_cor};box-shadow:0 0 8px {_orig_cor};"></div>'
                    f'<span style="font-size:14px;font-weight:700;color:#E8ECF2;">'
                    f'{_orig_nome}'
                    + (f' ···{_orig_final}' if _orig_final else '')
                    + '</span></div>',
                    unsafe_allow_html=True,
                )

                _fa, _fb, _fc, _fd, _fe = st.columns([3, 2, 2, 2, 1], gap="small")
                with _fa:
                    _new_nome = st.text_input(
                        "Nome / Banco", value=_orig_nome,
                        key=f"cfg_cnome_{_cid}",
                        placeholder="Santander, Nubank...",
                    )
                with _fb:
                    _new_prop = st.text_input(
                        "Proprietário", value=_orig_prop,
                        key=f"cfg_cprop_{_cid}",
                    )
                with _fc:
                    _new_final = st.text_input(
                        "Final (4 díg.)", value=_orig_final,
                        max_chars=4, key=f"cfg_cfinal_{_cid}",
                        placeholder="9477",
                    )
                with _fd:
                    _new_lim = st.number_input(
                        "Limite R$", min_value=0.0, value=_orig_lim,
                        step=100.0, format="%.2f",
                        key=f"cfg_clim_{_cid}",
                    )
                with _fe:
                    _new_cor = st.color_picker(
                        "Cor", value=_orig_cor,
                        key=f"cfg_ccor_{_cid}",
                    )

                _changed = (
                    (_new_nome.strip() or "") != _orig_nome
                    or (_new_prop.strip() or "") != _orig_prop
                    or (_new_final.strip() or "") != _orig_final
                    or _new_lim != _orig_lim
                    or _new_cor != _orig_cor
                )

                _bs, _bd, _ = st.columns([1, 1, 4])
                with _bs:
                    if _changed and st.button(
                        "💾 Salvar", key=f"cfg_csave_{_cid}", type="primary"
                    ):
                        database.update_cartao(
                            _cid,
                            nome=_new_nome.strip() or _orig_nome,
                            proprietario=_new_prop.strip() or None,
                            final_digitos=_new_final.strip() or None,
                            limite=_new_lim if _new_lim > 0 else None,
                            cor=_new_cor,
                        )
                        st.toast(f"Cartão '{_new_nome.strip() or _orig_nome}' salvo.")
                        st.rerun()
                with _bd:
                    with st.popover("🗑 Remover", use_container_width=True):
                        st.markdown(
                            f'<div style="font-size:13px;color:#E8ECF2;'
                            f'margin-bottom:10px;">'
                            f'Remover <b>{_orig_nome}</b>?<br>'
                            f'<span style="color:#FF6B7A;font-size:11px;">'
                            f'⚠️ Todas as faturas e transações serão apagadas.</span>'
                            f'</div>',
                            unsafe_allow_html=True,
                        )
                        if st.button(
                            "⚠️ Confirmar exclusão",
                            key=f"cfg_cconfirm_{_cid}",
                            type="primary",
                            use_container_width=True,
                        ):
                            database.delete_cartao(_cid)
                            db_acomp.delete_snapshots_for_cartao(_cid)
                            st.session_state["acomp_view_radio"] = 0
                            st.toast(f"Cartão '{_orig_nome}' removido.")
                            st.rerun()

                st.divider()

        # Adicionar novo cartão
        st.markdown("**Adicionar cartão**")
        _gc_nome = st.text_input(
            "Nome do banco", placeholder="Santander, Nubank, Itaú...",
            key="gc_nome",
        )
        _gc_prop = st.text_input("Proprietário", placeholder="Nome do titular",
                                  key="gc_prop")
        _gca, _gcb, _gcc = st.columns(3)
        with _gca:
            _gc_final = st.text_input("Final (4 dígitos)", max_chars=4,
                                       key="gc_final", placeholder="9477")
        with _gcb:
            _gc_limite = st.number_input("Limite R$", min_value=0.0,
                                          step=100.0, key="gc_limite", value=0.0)
        with _gcc:
            _gc_auto_cor = _banco_cor_cfg(_gc_nome) if _gc_nome else "#10F5A3"
            _gc_cor = st.color_picker("Cor", value=_gc_auto_cor, key="gc_cor")

        if st.button("➕ Adicionar Cartão", key="gc_add",
                     use_container_width=True,
                     disabled=not _gc_nome,
                     type="primary"):
            database.add_cartao(
                nome=_gc_nome,
                proprietario=_gc_prop or None,
                final_digitos=_gc_final or None,
                cor=_gc_cor,
                limite=_gc_limite if _gc_limite > 0 else None,
            )
            st.rerun()

    # ── CICLO ─────────────────────────────────────────────────────────────────
    with _t_ciclo:
        st.markdown("##### Configurações do ciclo de fatura")

        _dia_atual = db_acomp.get_dia_fechamento()
        _lim_atual = db_acomp.get_limite()

        _cy1, _cy2 = st.columns(2, gap="medium")
        with _cy1:
            _novo_dia = st.number_input(
                "Dia de fechamento da fatura",
                min_value=1, max_value=28,
                value=_dia_atual, key="cfg_dia",
                help="Fatura fecha nesse dia. Ciclo abre no dia seguinte.",
            )
        with _cy2:
            _novo_lim = st.number_input(
                "Limite global (R$)",
                min_value=0.0, step=100.0,
                value=_lim_atual, format="%.2f",
                key="cfg_lim",
                help="Fallback quando o cartão não tem limite individual.",
            )

        if st.button("💾 Salvar configurações do ciclo", key="btn_salvar_ciclo"):
            db_acomp.set_config("dia_fechamento", str(int(_novo_dia)))
            db_acomp.set_limite(_novo_lim)
            st.success("Configurações salvas!")
