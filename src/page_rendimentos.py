# -*- coding: utf-8 -*-
"""Página Rendimentos."""

import plotly.graph_objects as go
import streamlit as st

from src import database_gestao as db_g
from src import ui


def render(mes_ref_str: str) -> None:
    """
    Renderiza a página de Rendimentos.
    mes_ref_str: "YYYY-MM"
    """
    # ── Título ────────────────────────────────────────────────────────────────
    y, m = int(mes_ref_str[:4]), int(mes_ref_str[5:7])
    MESES_PT = {1:"Jan",2:"Fev",3:"Mar",4:"Abr",5:"Mai",6:"Jun",
                7:"Jul",8:"Ago",9:"Set",10:"Out",11:"Nov",12:"Dez"}
    mes_label = f"{MESES_PT[m]}/{y}"

    st.markdown(
        f'<div style="font-size:22px;font-weight:800;color:#E8ECF2;'
        f'padding-bottom:4px;">💰 Rendimentos</div>'
        f'<div style="font-size:12.5px;color:#4E5768;margin-bottom:18px;">'
        f'Receitas registradas em {mes_label} · histórico dos últimos 12 meses</div>',
        unsafe_allow_html=True,
    )

    total = db_g.total_rendimentos(mes_ref_str)
    por_cat = db_g.rendimentos_por_categoria(mes_ref_str)
    historico = db_g.historico_rendimentos(12)

    # ── KPIs ──────────────────────────────────────────────────────────────────
    _k1, _k2, _k3 = st.columns(3, gap="medium")
    with _k1:
        # Total do mês
        st.markdown(
            f'<div class="gf-kpi" style="border-top:3px solid #10F5A3;">'
            f'<div class="gf-kpi-label">TOTAL {mes_label}</div>'
            f'<div class="gf-kpi-value">{ui.fmt_brl(total)}</div>'
            f'<div class="gf-kpi-sub">{len(por_cat)} categorias</div>'
            f'</div>',
            unsafe_allow_html=True,
        )
    with _k2:
        # Maior categoria
        top_cat = max(por_cat, key=por_cat.get, default="—") if por_cat else "—"
        top_val = por_cat.get(top_cat, 0.0)
        pct_top = (top_val / total * 100) if total > 0 else 0
        st.markdown(
            f'<div class="gf-kpi" style="border-top:3px solid #B07AFF;">'
            f'<div class="gf-kpi-label">MAIOR FONTE</div>'
            f'<div class="gf-kpi-value">{top_cat}</div>'
            f'<div class="gf-kpi-sub">{ui.fmt_brl(top_val)} · {pct_top:.0f}% do total</div>'
            f'</div>',
            unsafe_allow_html=True,
        )
    with _k3:
        # Variação vs mês anterior
        if len(historico) >= 2:
            prev_total = float(historico[-2]["total"])
            delta = total - prev_total
            sinal = "+" if delta >= 0 else ""
            cor = "#10F5A3" if delta >= 0 else "#FF6B7A"
            sub = f'<span style="color:{cor}">{sinal}{ui.fmt_brl(delta)} vs mês anterior</span>'
        else:
            sub = "primeiro mês registrado"
        st.markdown(
            f'<div class="gf-kpi" style="border-top:3px solid #6FA9D6;">'
            f'<div class="gf-kpi-label">VARIAÇÃO MENSAL</div>'
            f'<div class="gf-kpi-value">{ui.fmt_brl(total)}</div>'
            f'<div class="gf-kpi-sub">{sub}</div>'
            f'</div>',
            unsafe_allow_html=True,
        )

    st.markdown('<div style="height:16px;"></div>', unsafe_allow_html=True)

    # ── Lançamentos do mês + Adicionar ────────────────────────────────────────
    _col_list, _col_add = st.columns([3, 2], gap="medium")

    with _col_list:
        ui.section(f"Lançamentos de {mes_label}", color="#10F5A3")
        rendimentos = db_g.list_rendimentos(mes_ref_str)

        if not rendimentos:
            st.markdown(
                '<div class="af-card" style="text-align:center;padding:32px;">'
                '<div style="color:#8B92A0;font-size:13px;">'
                'Nenhum rendimento registrado neste mês.<br>'
                'Use o formulário ao lado para adicionar.</div></div>',
                unsafe_allow_html=True,
            )
        else:
            for r in rendimentos:
                _lc1, _lc2, _lc3, _lc4 = st.columns([3, 2, 1, 1], gap="small")
                with _lc1:
                    _new_desc = st.text_input(
                        "Desc", value=r["descricao"],
                        key=f"rdesc_{r['id']}",
                        label_visibility="collapsed",
                    )
                with _lc2:
                    _new_cat = st.selectbox(
                        "Cat",
                        db_g.CATEGORIAS_RENDIMENTO,
                        index=(db_g.CATEGORIAS_RENDIMENTO.index(r["categoria"])
                               if r["categoria"] in db_g.CATEGORIAS_RENDIMENTO else 0),
                        key=f"rcat_{r['id']}",
                        label_visibility="collapsed",
                    )
                with _lc3:
                    _new_val = st.number_input(
                        "R$", value=float(r["valor"]),
                        min_value=0.0, step=100.0, format="%.2f",
                        key=f"rval_{r['id']}",
                        label_visibility="collapsed",
                    )
                with _lc4:
                    _rb1, _rb2 = st.columns(2)
                    with _rb1:
                        if st.button("💾", key=f"rsave_{r['id']}", help="Salvar"):
                            db_g.update_rendimento(
                                r["id"], _new_desc, _new_cat, _new_val
                            )
                            st.rerun()
                    with _rb2:
                        if st.button("🗑", key=f"rdel_{r['id']}", help="Remover"):
                            # Confirma com popover
                            st.session_state[f"confirm_del_r_{r['id']}"] = True
                            st.rerun()

                # Confirm delete
                if st.session_state.get(f"confirm_del_r_{r['id']}"):
                    with st.expander(f"⚠️ Confirmar exclusão de '{r['descricao']}'?",
                                     expanded=True):
                        _da, _db_btn, _dc = st.columns([1, 1, 3])
                        with _da:
                            if st.button("🗑 Confirmar", key=f"rconfirm_{r['id']}",
                                         type="primary"):
                                db_g.delete_rendimento(r["id"])
                                del st.session_state[f"confirm_del_r_{r['id']}"]
                                st.rerun()
                        with _db_btn:
                            if st.button("Cancelar", key=f"rcancel_{r['id']}"):
                                del st.session_state[f"confirm_del_r_{r['id']}"]
                                st.rerun()
                        if r.get("recorrente") and r.get("origem_id"):
                            if st.button("🗑 Apagar série inteira",
                                         key=f"rseries_{r['id']}"):
                                db_g.delete_rendimento(r["id"], apagar_serie=True)
                                del st.session_state[f"confirm_del_r_{r['id']}"]
                                st.rerun()

    with _col_add:
        ui.section("Adicionar Rendimento", color="#6FA9D6")
        with st.form(key="form_add_rendimento", clear_on_submit=True):
            _f_desc = st.text_input("Descrição", placeholder="ex: Salário Mai/25")
            _f_cat = st.selectbox("Categoria", db_g.CATEGORIAS_RENDIMENTO)
            _f_val = st.number_input("Valor (R$)", min_value=0.01,
                                     step=100.0, format="%.2f")
            _f_recorrente = st.toggle("Repetir nos próximos meses")
            _f_repeticoes = None
            if _f_recorrente:
                _f_repeticoes_opt = st.radio(
                    "Quantas vezes?",
                    ["Indefinidamente (24 meses)", "Número específico"],
                    horizontal=True,
                )
                if _f_repeticoes_opt == "Número específico":
                    _f_repeticoes = st.number_input(
                        "Repetições", min_value=1, max_value=60, value=12, step=1
                    )

            submitted = st.form_submit_button("➕ Adicionar", type="primary",
                                               use_container_width=True)
            if submitted:
                if _f_desc.strip() and _f_val > 0:
                    db_g.add_rendimento(
                        mes_ref=mes_ref_str,
                        descricao=_f_desc.strip(),
                        categoria=_f_cat,
                        valor=_f_val,
                        recorrente=_f_recorrente,
                        total_repeticoes=int(_f_repeticoes)
                        if _f_repeticoes else (None if _f_recorrente else None),
                    )
                    st.rerun()
                else:
                    st.warning("Preencha descrição e valor.")

    st.markdown('<div style="height:16px;"></div>', unsafe_allow_html=True)

    # ── Distribuição por categoria (donut) ────────────────────────────────────
    if por_cat:
        _g1, _g2 = st.columns([2, 3], gap="medium")

        with _g1:
            ui.section("Distribuição por Categoria", color="#B07AFF")
            _cats_list = list(por_cat.keys())
            _vals_list = [por_cat[c] for c in _cats_list]
            _COLORS = ["#10F5A3", "#B07AFF", "#6FA9D6", "#FF6B7A", "#FFB347",
                       "#3A4458", "#00CC88", "#FF8C00"]
            fig_donut = go.Figure(go.Pie(
                labels=_cats_list, values=_vals_list, hole=0.6,
                marker=dict(colors=_COLORS[:len(_cats_list)]),
                textinfo="none",
                hovertemplate="%{label}<br><b>%{value:,.2f}</b><br>%{percent}<extra></extra>",
            ))
            fig_donut.add_annotation(
                text=f"<b>{ui.fmt_brl(total)}</b>",
                x=0.5, y=0.5, showarrow=False,
                font=dict(size=13, color="#E8ECF2"),
            )
            fig_donut.update_layout(
                paper_bgcolor="rgba(0,0,0,0)",
                plot_bgcolor="rgba(0,0,0,0)",
                font=dict(color="#C8CDD6", size=12),
                showlegend=True,
                legend=dict(
                    orientation="v",
                    bgcolor="rgba(0,0,0,0)",
                    font=dict(color="#8B92A0", size=11),
                    x=0.72, y=0.5, xanchor="left", yanchor="middle",
                ),
                margin=dict(t=8, b=8, l=0, r=80),
                height=260,
            )
            st.plotly_chart(fig_donut, use_container_width=True,
                            config={"displayModeBar": False},
                            key="rend_donut")

        with _g2:
            if len(historico) > 1:
                ui.section("Evolução dos Últimos 12 Meses", color="#10F5A3")
                _hm = [h["mes_ref"] for h in historico]
                _ht = [float(h["total"]) for h in historico]

                # Labels friendly: "Jan/25"
                def _ml(mr: str) -> str:
                    yy, mm = mr[:4], int(mr[5:7])
                    return f"{MESES_PT[mm]}/{yy[2:]}"

                fig_hist = go.Figure()
                fig_hist.add_trace(go.Bar(
                    x=[_ml(h) for h in _hm], y=_ht,
                    marker=dict(color="#10F5A344",
                                line=dict(color="#10F5A3", width=1.5)),
                    name="Rendimento",
                    hovertemplate="<b>%{x}</b><br>R$ %{y:,.2f}<extra></extra>",
                ))
                fig_hist.add_trace(go.Scatter(
                    x=[_ml(h) for h in _hm], y=_ht,
                    mode="lines+markers",
                    line=dict(color="#10F5A3", width=2),
                    marker=dict(size=6, color="#10F5A3",
                                line=dict(color="#0B0E13", width=2)),
                    showlegend=False,
                ))
                fig_hist.update_layout(
                    paper_bgcolor="rgba(0,0,0,0)",
                    plot_bgcolor="rgba(0,0,0,0)",
                    font=dict(color="#C8CDD6", size=11),
                    showlegend=False,
                    xaxis=dict(gridcolor="#1A2030", color="#4E5768",
                               linecolor="#1A2030"),
                    yaxis=dict(gridcolor="#1A2030", color="#4E5768",
                               linecolor="#1A2030",
                               tickprefix="R$ ", tickformat=",.0f"),
                    margin=dict(t=8, b=30, l=80, r=10),
                    height=260,
                )
                st.plotly_chart(fig_hist, use_container_width=True,
                                config={"displayModeBar": False},
                                key="rend_hist_bar")
