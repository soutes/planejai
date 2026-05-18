# -*- coding: utf-8 -*-
"""Página Investimentos — snapshot mensal por categoria."""

import plotly.graph_objects as go
import streamlit as st

from src import database_gestao as db_g
from src import ui


MESES_ABREV = {
    1:"Jan", 2:"Fev", 3:"Mar", 4:"Abr", 5:"Mai", 6:"Jun",
    7:"Jul", 8:"Ago", 9:"Set", 10:"Out", 11:"Nov", 12:"Dez",
}
MESES_PT = {
    1:"Janeiro", 2:"Fevereiro", 3:"Março", 4:"Abril",
    5:"Maio", 6:"Junho", 7:"Julho", 8:"Agosto",
    9:"Setembro", 10:"Outubro", 11:"Novembro", 12:"Dezembro",
}

_CAT_COLORS: dict[str, str] = {
    "Reserva de Emergência":  "#10F5A3",
    "Renda Fixa":             "#6FA9D6",
    "Tesouro Direto":         "#B07AFF",
    "Ações":                  "#FF6B7A",
    "FIIs":                   "#FFB347",
    "Previdência Privada":    "#00CC88",
    "Fundos":                 "#FF8C00",
    "Cripto":                 "#FFD700",
    "Internacional":          "#A0A0FF",
}


def render(mes_ref_str: str) -> None:
    """
    Renderiza a página de Investimentos.
    mes_ref_str: "YYYY-MM"
    """
    y, m = int(mes_ref_str[:4]), int(mes_ref_str[5:7])
    mes_label = f"{MESES_PT[m]} {y}"

    total = db_g.total_patrimonio(mes_ref_str)
    historico = db_g.historico_patrimonio(12)
    distribuicao = db_g.distribuicao_investimentos(mes_ref_str)

    # ── Título ────────────────────────────────────────────────────────────────
    st.markdown(
        f'<div style="font-size:22px;font-weight:800;color:#E8ECF2;'
        f'padding-bottom:4px;display:flex;align-items:center;">'
        f'{ui.page_icon("trend")}Investimentos</div>'
        f'<div style="font-size:12.5px;color:#4E5768;margin-bottom:18px;">'
        f'Snapshot de {mes_label} · Histórico de patrimônio</div>',
        unsafe_allow_html=True,
    )

    # ── KPIs ──────────────────────────────────────────────────────────────────
    _k1, _k2, _k3, _k4 = st.columns(4, gap="medium")

    with _k1:
        st.markdown(
            f'<div class="gf-kpi" style="border-top:3px solid #10F5A3;">'
            f'<div class="gf-kpi-label">PATRIMÔNIO {mes_label[:3].upper()}</div>'
            f'<div class="gf-kpi-value">{ui.fmt_brl(total)}</div>'
            f'<div class="gf-kpi-sub">{len(distribuicao)} categorias</div>'
            f'</div>',
            unsafe_allow_html=True,
        )

    # Variação
    if len(historico) >= 2:
        prev_total = float(historico[-2]["total"])
        delta = total - prev_total
        sinal = "+" if delta >= 0 else ""
        cor_d = "#10F5A3" if delta >= 0 else "#FF6B7A"
        kpi_var_inv = f'<div class="gf-kpi-value" style="color:{cor_d}">{sinal}{ui.fmt_brl(delta)}</div>'
        sub_var = f'<span style="color:{cor_d}">vs mês anterior</span>'
    else:
        kpi_var_inv = f'<div class="gf-kpi-value">{ui.fmt_brl(total)}</div>'
        sub_var = "primeiro mês"

    with _k2:
        st.markdown(
            f'<div class="gf-kpi" style="border-top:3px solid #6FA9D6;">'
            f'<div class="gf-kpi-label">VARIAÇÃO VS MÊS ANTERIOR</div>'
            f'{kpi_var_inv}'
            f'<div class="gf-kpi-sub">{sub_var}</div>'
            f'</div>',
            unsafe_allow_html=True,
        )

    # Aporte do mês
    aporte_mes = sum(
        float(h["aporte"]) for h in historico
        if h["mes_ref"] == mes_ref_str
    ) if historico else 0.0
    with _k3:
        st.markdown(
            f'<div class="gf-kpi" style="border-top:3px solid #B07AFF;">'
            f'<div class="gf-kpi-label">APORTE {mes_label[:3].upper()}</div>'
            f'<div class="gf-kpi-value">{ui.fmt_brl(aporte_mes)}</div>'
            f'<div class="gf-kpi-sub">novo capital aportado</div>'
            f'</div>',
            unsafe_allow_html=True,
        )

    # Maior posição
    top_dist = distribuicao[0] if distribuicao else None
    top_label = top_dist["categoria"] if top_dist else "—"
    top_val = float(top_dist["total"]) if top_dist else 0.0
    top_pct = (top_val / total * 100) if total > 0 else 0
    with _k4:
        st.markdown(
            f'<div class="gf-kpi" style="border-top:3px solid #FFB347;">'
            f'<div class="gf-kpi-label">MAIOR POSIÇÃO</div>'
            f'<div class="gf-kpi-value" style="font-size:18px;">{top_label}</div>'
            f'<div class="gf-kpi-sub">{ui.fmt_brl(top_val)} · {top_pct:.0f}% do total</div>'
            f'</div>',
            unsafe_allow_html=True,
        )

    st.markdown('<div style="height:16px;"></div>', unsafe_allow_html=True)

    # ── Snapshot edição + gráficos ────────────────────────────────────────────
    _col_edit, _col_charts = st.columns([2, 3], gap="medium")

    with _col_edit:
        ui.section(f"Snapshot de {mes_label}", color="#10F5A3")
        st.caption(
            "Registre o saldo atual de cada investimento. "
            "Valores salvos são imutáveis nos meses anteriores — "
            "apenas o mês atual pode ser editado."
        )

        snap_atual = db_g.list_investimentos(mes_ref_str)
        snap_map: dict[tuple, dict] = {
            (s["categoria"], s["instituicao"]): s for s in snap_atual
        }

        with st.form(key=f"form_invest_{mes_ref_str}", clear_on_submit=False):
            for cat in db_g.CATEGORIAS_INVESTIMENTO:
                _snap = snap_map.get((cat, ""), None)
                _val_atual = float(_snap["valor"]) if _snap else 0.0
                _aporte_atual = float(_snap["aporte_mes"]) if _snap else 0.0

                _ci1, _ci2, _ci3 = st.columns([2, 2, 2], gap="small")
                with _ci1:
                    cor_cat = _CAT_COLORS.get(cat, "#8B92A0")
                    st.markdown(
                        f'<div style="padding:8px 0;font-size:12.5px;'
                        f'color:{cor_cat};font-weight:600;">{cat}</div>',
                        unsafe_allow_html=True,
                    )
                with _ci2:
                    st.number_input(
                        "Saldo R$", value=_val_atual,
                        min_value=0.0, step=100.0, format="%.2f",
                        key=f"inv_val_{cat}",
                        label_visibility="collapsed",
                        help=f"Saldo total em {cat}",
                    )
                with _ci3:
                    st.number_input(
                        "Aporte R$", value=_aporte_atual,
                        min_value=0.0, step=100.0, format="%.2f",
                        key=f"inv_ap_{cat}",
                        label_visibility="collapsed",
                        help="Quanto você aportou este mês",
                    )

            if st.form_submit_button(
                "💾 Salvar Snapshot", type="primary", use_container_width=True
            ):
                for cat in db_g.CATEGORIAS_INVESTIMENTO:
                    val = st.session_state.get(f"inv_val_{cat}", 0.0)
                    ap = st.session_state.get(f"inv_ap_{cat}", 0.0)
                    if val > 0 or ap > 0:
                        db_g.upsert_investimento(
                            mes_ref=mes_ref_str,
                            categoria=cat,
                            instituicao="",
                            valor=val,
                            aporte_mes=ap,
                        )
                st.success("Snapshot salvo!")
                st.rerun()

    with _col_charts:
        # Donut distribuição
        if distribuicao:
            ui.section("Distribuição Atual", color="#B07AFF")
            _cats_d = [d["categoria"] for d in distribuicao]
            _vals_d = [float(d["total"]) for d in distribuicao]
            _colors_d = [_CAT_COLORS.get(c, "#3A4458") for c in _cats_d]

            fig_donut = go.Figure(go.Pie(
                labels=_cats_d, values=_vals_d, hole=0.62,
                marker=dict(colors=_colors_d),
                textinfo="none",
                hovertemplate="%{label}<br><b>R$ %{value:,.2f}</b><br>%{percent}<extra></extra>",
                domain=dict(x=[0, 0.55]),
            ))
            fig_donut.add_annotation(
                text=f"<b>{ui.fmt_brl(total)}</b>",
                x=0.275, y=0.5, showarrow=False,
                xanchor="center", yanchor="middle",
                font=dict(size=12, color="#E8ECF2"),
            )
            fig_donut.update_layout(
                paper_bgcolor="rgba(0,0,0,0)",
                plot_bgcolor="rgba(0,0,0,0)",
                font=dict(color="#C8CDD6", size=11),
                showlegend=True,
                legend=dict(
                    orientation="v", bgcolor="rgba(0,0,0,0)",
                    font=dict(color="#8B92A0", size=10),
                    x=0.59, y=0.5, xanchor="left", yanchor="middle",
                    tracegroupgap=2,
                ),
                margin=dict(t=8, b=8, l=0, r=10),
                height=280,
            )
            st.plotly_chart(fig_donut, use_container_width=True,
                            config={"displayModeBar": False},
                            key="inv_donut")

        # Evolução histórica
        if len(historico) > 1:
            ui.section("Evolução do Patrimônio", color="#10F5A3")

            def _ml(mr: str) -> str:
                mm = int(mr[5:7])
                yy = mr[2:4]
                return f"{MESES_ABREV[mm]}/{yy}"

            _hm = [_ml(h["mes_ref"]) for h in historico]
            _ht = [float(h["total"]) for h in historico]
            _ha = [float(h["aporte"]) for h in historico]

            fig_line = go.Figure()
            fig_line.add_trace(go.Bar(
                x=_hm, y=_ha,
                name="Aporte",
                marker=dict(color="rgba(176,122,255,0.27)",
                            line=dict(color="#B07AFF", width=1.5)),
                hovertemplate="<b>%{x}</b><br>Aporte: R$ %{y:,.2f}<extra></extra>",
            ))
            fig_line.add_trace(go.Scatter(
                x=_hm, y=_ht,
                name="Patrimônio",
                mode="lines+markers",
                line=dict(color="#10F5A3", width=2.5),
                marker=dict(size=7, color="#10F5A3",
                            line=dict(color="#0B0E13", width=2)),
                hovertemplate="<b>%{x}</b><br>R$ %{y:,.2f}<extra></extra>",
            ))
            fig_line.update_layout(
                paper_bgcolor="rgba(0,0,0,0)",
                plot_bgcolor="rgba(0,0,0,0)",
                font=dict(color="#C8CDD6", size=11),
                barmode="overlay",
                showlegend=True,
                legend=dict(
                    orientation="h", bgcolor="rgba(0,0,0,0)",
                    font=dict(color="#8B92A0", size=10), y=-0.22,
                ),
                xaxis=dict(gridcolor="#1A2030", color="#4E5768",
                           linecolor="#1A2030"),
                yaxis=dict(
                    gridcolor="#1A2030", color="#4E5768", linecolor="#1A2030",
                    tickprefix="R$ ", tickformat=",.0f",
                ),
                margin=dict(t=8, b=50, l=90, r=10),
                height=280,
            )
            st.plotly_chart(fig_line, use_container_width=True,
                            config={"displayModeBar": False},
                            key="inv_line")

    # ── Tabela histórica de snapshots ─────────────────────────────────────────
    if historico:
        with st.expander("📋 Histórico completo de snapshots"):
            import pandas as pd
            rows = []
            for h in reversed(historico):
                mm_h = int(h["mes_ref"][5:7])
                yy_h = h["mes_ref"][:4]
                rows.append({
                    "Mês": f"{MESES_ABREV[mm_h]}/{yy_h}",
                    "Patrimônio Total": ui.fmt_brl(float(h["total"])),
                    "Aporte do Mês": ui.fmt_brl(float(h["aporte"])),
                })
            st.dataframe(
                pd.DataFrame(rows),
                use_container_width=True,
                hide_index=True,
            )
