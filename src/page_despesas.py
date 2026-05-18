# -*- coding: utf-8 -*-
"""Página Despesas — mensal com abas, split e visão anual."""

import datetime

import plotly.graph_objects as go
import streamlit as st

from src import database_gestao as db_g
from src import ui


MESES_PT = {
    1: "Janeiro", 2: "Fevereiro", 3: "Março", 4: "Abril",
    5: "Maio", 6: "Junho", 7: "Julho", 8: "Agosto",
    9: "Setembro", 10: "Outubro", 11: "Novembro", 12: "Dezembro",
}
MESES_ABREV = {
    1:"Jan", 2:"Fev", 3:"Mar", 4:"Abr", 5:"Mai", 6:"Jun",
    7:"Jul", 8:"Ago", 9:"Set", 10:"Out", 11:"Nov", 12:"Dez",
}


def _budget_bars(aba_id: int, mes_ref_str: str, cats_gastos: dict[str, float]) -> None:
    """Barras de orçamento por categoria."""
    orcamentos = db_g.list_orcamentos(aba_id, mes_ref_str)
    if not orcamentos:
        return
    ui.section("Metas de Orçamento", color="#B07AFF")
    for o in orcamentos:
        cat = o["categoria"]
        meta = float(o["valor_meta"])
        gasto = cats_gastos.get(cat, 0.0)
        pct = min((gasto / meta * 100) if meta > 0 else 0, 100)
        cor = "#10F5A3" if pct < 70 else ("#FFB347" if pct < 95 else "#FF6B7A")
        st.markdown(
            f'<div style="margin-bottom:10px;">'
            f'<div style="display:flex;justify-content:space-between;'
            f'font-size:12px;color:#C8CDD6;margin-bottom:4px;">'
            f'<span>{cat}</span>'
            f'<span style="color:{cor};font-weight:600;">'
            f'{ui.fmt_brl(gasto)} / {ui.fmt_brl(meta)} ({pct:.0f}%)</span></div>'
            f'<div style="background:#1A2030;border-radius:4px;height:6px;">'
            f'<div style="background:{cor};width:{pct:.0f}%;height:6px;'
            f'border-radius:4px;box-shadow:0 0 6px {cor}55;"></div></div>'
            f'</div>',
            unsafe_allow_html=True,
        )


def _render_aba_mensal(aba: dict, mes_ref_str: str, cats_nomes: list[str]) -> None:
    """Renderiza conteúdo de uma aba no modo mensal."""
    aba_id = aba["id"]
    aba_cor = aba["cor"]
    tem_split = bool(aba.get("pessoas"))

    despesas = db_g.list_despesas(aba_id, mes_ref_str)
    total = sum(d["valor"] for d in despesas)
    cats_gastos = db_g.despesas_por_categoria_mes(aba_id, mes_ref_str)

    # KPI rápido
    st.markdown(
        f'<div style="display:flex;align-items:baseline;justify-content:center;gap:12px;margin-bottom:12px;">'
        f'<div style="font-size:26px;font-weight:800;color:{aba_cor};">'
        f'{ui.fmt_brl(total)}</div>'
        f'<div style="font-size:13px;color:#4E5768;">'
        f'{len(despesas)} lançamentos · {len(cats_gastos)} categorias</div>'
        f'</div>',
        unsafe_allow_html=True,
    )

    # Lista de despesas
    if despesas:
        for d in despesas:
            _tipo_badge = ""
            _readonly = d["tipo"] == "cartao_ciclo"
            if d["tipo"] == "cartao_ciclo":
                _tipo_badge = (
                    '<span style="font-size:9px;background:#B07AFF1A;color:#B07AFF;'
                    'border:1px solid #B07AFF33;border-radius:4px;'
                    'padding:1px 5px;margin-left:6px;">FATURA</span>'
                )
            elif d["tipo"] == "split_auto":
                _tipo_badge = (
                    '<span style="font-size:9px;background:#10F5A31A;color:#10F5A3;'
                    'border:1px solid #10F5A333;border-radius:4px;'
                    'padding:1px 5px;margin-left:6px;">AUTO-SPLIT</span>'
                )
            elif d.get("total_parcelas") and d.get("parcela_num"):
                _tipo_badge = (
                    f'<span style="font-size:9px;background:#B07AFF1A;color:#B07AFF;'
                    f'border:1px solid #B07AFF33;border-radius:4px;'
                    f'padding:1px 5px;margin-left:6px;">'
                    f'{d["parcela_num"]}/{d["total_parcelas"]}×</span>'
                )
            elif d.get("recorrente"):
                _tipo_badge = (
                    '<span style="font-size:9px;background:#6FA9D61A;color:#6FA9D6;'
                    'border:1px solid #6FA9D633;border-radius:4px;'
                    'padding:1px 5px;margin-left:6px;">RECORRENTE</span>'
                )

            _dc1, _dc2, _dc3, _dc4, _dc5 = st.columns(
                [3, 2, 1, 1, 1], gap="small"
            )
            with _dc1:
                st.markdown(
                    f'<div style="padding:7px 0;font-size:13.5px;color:#E8ECF2;">'
                    f'{d["descricao"]}{_tipo_badge}</div>',
                    unsafe_allow_html=True,
                )
            with _dc2:
                st.markdown(
                    f'<div style="padding:7px 0;font-size:12px;color:#8B92A0;">'
                    f'{d["categoria"]}</div>',
                    unsafe_allow_html=True,
                )
            with _dc3:
                st.markdown(
                    f'<div style="padding:7px 0;font-size:13.5px;font-weight:700;'
                    f'color:{aba_cor};text-align:right;">'
                    f'{ui.fmt_brl(d["valor"])}</div>',
                    unsafe_allow_html=True,
                )
            with _dc4:
                if _readonly:
                    st.markdown(
                        '<div style="padding:7px 0;font-size:11px;color:#4E5768;'
                        'text-align:center;" title="Editar na pagina Cartao">'
                        '🔒</div>',
                        unsafe_allow_html=True,
                    )
                else:
                    if st.button("", icon=":material/edit:", key=f"dedit_{d['id']}", help="Editar"):
                        st.session_state[f"editing_despesa_{d['id']}"] = True
                        st.rerun()
            with _dc5:
                if _readonly:
                    st.markdown(
                        '<div style="padding:7px 0;font-size:11px;color:#4E5768;'
                        'text-align:center;">—</div>',
                        unsafe_allow_html=True,
                    )
                else:
                    if st.button("", icon=":material/delete:", key=f"ddel_{d['id']}", help="Excluir"):
                        st.session_state[f"confirm_del_d_{d['id']}"] = True
                        st.rerun()

            # Inline edit
            if st.session_state.get(f"editing_despesa_{d['id']}"):
                with st.container():
                    _ea, _eb, _ec, _ed = st.columns([3, 2, 1, 1], gap="small")
                    with _ea:
                        _e_desc = st.text_input(
                            "Descrição", value=d["descricao"],
                            key=f"e_desc_{d['id']}",
                        )
                    with _eb:
                        _e_cat_opts = (cats_nomes if d["categoria"] in cats_nomes
                                       else [d["categoria"]] + cats_nomes)
                        _e_cat = st.selectbox(
                            "Categoria", _e_cat_opts,
                            index=_e_cat_opts.index(d["categoria"]),
                            key=f"e_cat_{d['id']}",
                        )
                    with _ec:
                        _e_val = st.number_input(
                            "R$", value=float(d["valor"]),
                            min_value=0.01, step=10.0, format="%.2f",
                            key=f"e_val_{d['id']}",
                        )
                    with _ed:
                        _e_notas = st.text_input(
                            "Notas", value=d.get("notas") or "",
                            key=f"e_notas_{d['id']}",
                        )
                    _save_btn, _cancel_btn = st.columns(2)
                    with _save_btn:
                        if st.button("Salvar", icon=":material/save:", key=f"e_save_{d['id']}",
                                     type="primary"):
                            db_g.update_despesa(
                                d["id"], _e_desc, _e_cat,
                                _e_val, d.get("data"),
                                _e_notas or None,
                            )
                            del st.session_state[f"editing_despesa_{d['id']}"]
                            st.rerun()
                    with _cancel_btn:
                        if st.button("Cancelar", icon=":material/close:", key=f"e_cancel_{d['id']}"):
                            del st.session_state[f"editing_despesa_{d['id']}"]
                            st.rerun()

            # Confirm delete
            if st.session_state.get(f"confirm_del_d_{d['id']}"):
                with st.expander(
                    f"Excluir '{d['descricao']}'?", icon=":material/warning:", expanded=True
                ):
                    _da_btn, _db_btn2, _dc_btn = st.columns([1, 1, 2])
                    with _da_btn:
                        if st.button("Excluir", icon=":material/delete:", key=f"dconfirm_{d['id']}",
                                     type="primary"):
                            db_g.delete_despesa(d["id"])
                            del st.session_state[f"confirm_del_d_{d['id']}"]
                            st.rerun()
                    with _db_btn2:
                        if st.button("Cancelar", key=f"dcancel_{d['id']}"):
                            del st.session_state[f"confirm_del_d_{d['id']}"]
                            st.rerun()
                    if d.get("recorrente") or d.get("origem_id"):
                        with _dc_btn:
                            if st.button("Apagar série", icon=":material/delete:",
                                         key=f"dseries_{d['id']}"):
                                db_g.delete_despesa(d["id"], apagar_serie=True)
                                del st.session_state[f"confirm_del_d_{d['id']}"]
                                st.rerun()

    st.divider()

    # ── Adicionar despesa ─────────────────────────────────────────────────────
    with st.expander("Adicionar Despesa", icon=":material/add:", expanded=(not despesas)):
        with st.form(key=f"form_add_desp_{aba_id}", clear_on_submit=True):
            _f1, _f2, _f3 = st.columns([3, 2, 2], gap="small")
            with _f1:
                _f_desc = st.text_input("Descrição",
                                         placeholder="ex: Supermercado")
            with _f2:
                _f_cat = st.selectbox("Categoria", cats_nomes)
            with _f3:
                _f_val = st.number_input("Valor (R$)", min_value=0.01,
                                          step=10.0, format="%.2f")

            _f4, _f5 = st.columns(2, gap="small")
            with _f4:
                _f_data = st.date_input(
                    "Data",
                    value=datetime.date.today(),
                    format="DD/MM/YYYY",
                )
            with _f5:
                _f_notas = st.text_input("Notas (opcional)", "")

            # Recorrência / parcelamento
            _fr1, _fr2 = st.columns(2, gap="small")
            with _fr1:
                _f_tipo_rep = st.radio(
                    "Repetição",
                    ["Único", "Recorrente", "Parcelado"],
                    horizontal=True,
                )
            with _fr2:
                _f_repeticoes = None
                _f_n_parcelas = None
                if _f_tipo_rep == "Recorrente":
                    _f_rep_opt = st.radio(
                        "Por quanto tempo?",
                        ["Indefinidamente", "Número específico"],
                        horizontal=True,
                    )
                    if _f_rep_opt == "Número específico":
                        _f_repeticoes = st.number_input(
                            "Meses", min_value=1, max_value=60, value=12
                        )
                elif _f_tipo_rep == "Parcelado":
                    _f_n_parcelas = st.number_input(
                        "Número de parcelas", min_value=2, max_value=60, value=12
                    )

            # Split — só aparece se a aba tem pessoas
            _f_pessoas_split: list[dict] = []
            if tem_split:
                st.markdown("**Dividir com:**")
                _pessoas_aba = aba.get("pessoas", [])
                _sc = st.columns(min(len(_pessoas_aba), 4), gap="small")
                for ip, pessoa in enumerate(_pessoas_aba):
                    with _sc[ip % 4]:
                        _checked = st.checkbox(
                            pessoa["nome"],
                            value=True,
                            key=f"sp_check_{aba_id}_{pessoa['pessoa_id']}",
                        )
                        if _checked:
                            _ratio = st.number_input(
                                "% da parte",
                                min_value=1, max_value=100,
                                value=int(pessoa["ratio_default"] * 100),
                                key=f"sp_ratio_{aba_id}_{pessoa['pessoa_id']}",
                                help=f"% de {pessoa['nome']}",
                            )
                            _f_pessoas_split.append({
                                "pessoa_id": pessoa["pessoa_id"],
                                "nome": pessoa["nome"],
                                "ratio": _ratio / 100,
                            })

            submitted = st.form_submit_button(
                "Adicionar", icon=":material/add:", type="primary", use_container_width=True
            )

            if submitted:
                if not _f_desc.strip() or _f_val <= 0:
                    st.warning("Preencha descrição e valor.")
                else:
                    _recorrente = _f_tipo_rep == "Recorrente"
                    _parcelas = int(_f_n_parcelas) if _f_n_parcelas else None
                    _total_rep = int(_f_repeticoes) if _f_repeticoes else None

                    nova_id = db_g.add_despesa(
                        aba_id=aba_id,
                        mes_ref=mes_ref_str,
                        descricao=_f_desc.strip(),
                        categoria=_f_cat,
                        valor=_f_val,
                        data=_f_data.isoformat(),
                        notas=_f_notas.strip() or None,
                        tipo="manual",
                        recorrente=_recorrente,
                        total_repeticoes=_total_rep,
                        parcela_num=1 if _parcelas else None,
                        total_parcelas=_parcelas,
                    )

                    # Split logic
                    if _f_pessoas_split:
                        for sp in _f_pessoas_split:
                            val_sp = round(_f_val * sp["ratio"], 2)
                            db_g.add_despesa_split(
                                nova_id, sp["pessoa_id"], sp["ratio"], val_sp
                            )
                            # Divisão entry: essa pessoa deve a mim
                            db_g.add_divisao_entry(
                                pessoa_id=sp["pessoa_id"],
                                mes_ref=mes_ref_str,
                                descricao=_f_desc.strip(),
                                valor_total=val_sp,
                                direcao="a_receber",
                                origem_despesa_id=nova_id,
                            )

                        # Auto-split: minha parte entra em Pessoal
                        _total_outros = sum(sp["ratio"] for sp in _f_pessoas_split)
                        _minha_ratio = max(0, 1 - _total_outros)
                        if _minha_ratio > 0 and aba.get("split_destino_categoria"):
                            _meu_val = round(_f_val * _minha_ratio, 2)
                            _abas_all = db_g.list_abas()
                            _aba_pessoal = next(
                                (a for a in _abas_all
                                 if a["nome"] == "Pessoal" and a["ativo"]),
                                None,
                            )
                            if _aba_pessoal:
                                db_g.add_despesa(
                                    aba_id=_aba_pessoal["id"],
                                    mes_ref=mes_ref_str,
                                    descricao=f"[Split] {_f_desc.strip()}",
                                    categoria=aba["split_destino_categoria"],
                                    valor=_meu_val,
                                    data=_f_data.isoformat(),
                                    tipo="split_auto",
                                    origem_id=nova_id,
                                )

                    st.rerun()

    # ── Barras de orçamento ───────────────────────────────────────────────────
    _budget_bars(aba_id, mes_ref_str, cats_gastos)

    # ── Divisão de gastos ─────────────────────────────────────────────────────
    if tem_split:
        saldos = db_g.saldo_divisao_por_pessoa(mes_ref_str)
        if any(abs(s["saldo_liquido"]) > 0.01 for s in saldos):
            ui.section("Divisão de Gastos", color="#FFB347")
            for s in saldos:
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
                    f'padding:10px 16px;margin-bottom:6px;">'
                    f'<div style="color:#C8CDD6;font-size:13.5px;">{texto}</div>'
                    f'</div>',
                    unsafe_allow_html=True,
                )

            # Entradas detalhadas (a_receber pendentes)
            entries = db_g.list_divisao_entries(mes_ref=mes_ref_str, quitado=False)
            if entries:
                with st.expander(f"📋 Detalhamento ({len(entries)} pendentes)"):
                    for e in entries:
                        _ec1, _ec2, _ec3 = st.columns([4, 2, 1], gap="small")
                        with _ec1:
                            dir_txt = "↑ a receber" if e["direcao"] == "a_receber" \
                                else "↓ a pagar"
                            cor_dir = "#10F5A3" if e["direcao"] == "a_receber" \
                                else "#FF6B7A"
                            st.markdown(
                                f'<div style="font-size:13px;padding:4px 0;">'
                                f'<b style="color:{e["pessoa_cor"]}">'
                                f'{e["pessoa_nome"]}</b> — {e["descricao"]} '
                                f'<span style="color:{cor_dir};font-size:11px;">'
                                f'{dir_txt}</span>'
                                f'</div>',
                                unsafe_allow_html=True,
                            )
                        with _ec2:
                            st.markdown(
                                f'<div style="font-size:13px;font-weight:700;'
                                f'color:#E8ECF2;padding:4px 0;text-align:right;">'
                                f'{ui.fmt_brl(e["valor_total"])}</div>',
                                unsafe_allow_html=True,
                            )
                        with _ec3:
                            if st.button("✓", key=f"quitar_{e['id']}",
                                         help="Marcar como quitado"):
                                db_g.quitar_divisao(e["id"])
                                st.rerun()


def _render_anual(mes_ref_str: str) -> None:
    """Visão anual: tabela categorias × meses."""
    y = int(mes_ref_str[:4])
    st.markdown(
        f'<div style="font-size:16px;font-weight:700;color:#E8ECF2;'
        f'margin-bottom:12px;">Visão Anual {y}</div>',
        unsafe_allow_html=True,
    )

    # Coleta dados dos 12 meses
    all_cats: set[str] = set()
    meses_data: dict[str, dict[str, float]] = {}
    for mm in range(1, 13):
        mr = f"{y:04d}-{mm:02d}"
        cats_mes = db_g.despesas_por_categoria_mes(None, mr)
        meses_data[mr] = cats_mes
        all_cats.update(cats_mes.keys())

    if not all_cats:
        st.info("Nenhum dado de despesas para este ano.")
        return

    cats_sorted = sorted(all_cats)
    meses_labels = [MESES_ABREV[mm] for mm in range(1, 13)]

    # Stacked bar chart
    _COLORS = ["#10F5A3", "#B07AFF", "#6FA9D6", "#FF6B7A", "#FFB347",
               "#3A4458", "#00CC88", "#FF8C00", "#A0A0FF", "#FF66CC",
               "#80FF00", "#FFD700"]

    fig = go.Figure()
    for idx, cat in enumerate(cats_sorted):
        yvals = [
            meses_data.get(f"{y:04d}-{mm:02d}", {}).get(cat, 0.0)
            for mm in range(1, 13)
        ]
        if sum(yvals) == 0:
            continue
        fig.add_trace(go.Bar(
            name=cat,
            x=meses_labels,
            y=yvals,
            marker=dict(color=_COLORS[idx % len(_COLORS)]),
            hovertemplate=f"<b>{cat}</b><br>%{{x}}: R$ %{{y:,.2f}}<extra></extra>",
        ))

    fig.update_layout(
        paper_bgcolor="rgba(0,0,0,0)",
        plot_bgcolor="rgba(0,0,0,0)",
        font=dict(color="#C8CDD6", size=11),
        barmode="stack",
        bargap=0.2,
        showlegend=True,
        legend=dict(
            orientation="h",
            bgcolor="rgba(0,0,0,0)",
            font=dict(color="#8B92A0", size=10),
            y=-0.25,
        ),
        xaxis=dict(gridcolor="#1A2030", color="#4E5768", linecolor="#1A2030"),
        yaxis=dict(
            gridcolor="#1A2030", color="#4E5768", linecolor="#1A2030",
            tickprefix="R$ ", tickformat=",.0f",
        ),
        margin=dict(t=10, b=80, l=90, r=10),
        height=380,
    )
    st.plotly_chart(fig, use_container_width=True,
                    config={"displayModeBar": False}, key="anual_stack")

    # Tabela resumo
    import pandas as pd
    rows = []
    for cat in cats_sorted:
        row: dict = {"Categoria": cat}
        anual = 0.0
        for mm in range(1, 13):
            mr = f"{y:04d}-{mm:02d}"
            v = meses_data.get(mr, {}).get(cat, 0.0)
            row[MESES_ABREV[mm]] = f"R$ {v:,.0f}".replace(",", ".") if v > 0 else "—"
            anual += v
        row["Total"] = f"R$ {anual:,.0f}".replace(",", ".")
        rows.append(row)

    # Total por mês
    total_row: dict = {"Categoria": "**TOTAL**"}
    total_anual = 0.0
    for mm in range(1, 13):
        mr = f"{y:04d}-{mm:02d}"
        t = sum(meses_data.get(mr, {}).values())
        total_row[MESES_ABREV[mm]] = (
            f"R$ {t:,.0f}".replace(",", ".") if t > 0 else "—"
        )
        total_anual += t
    total_row["Total"] = f"R$ {total_anual:,.0f}".replace(",", ".")
    rows.append(total_row)

    df_anual = pd.DataFrame(rows)
    st.dataframe(df_anual, use_container_width=True, hide_index=True)


# ══════════════════════════════════════════════════════════════════════════════
# RENDER PRINCIPAL
# ══════════════════════════════════════════════════════════════════════════════
def render(mes_ref_str: str) -> None:
    y, m = int(mes_ref_str[:4]), int(mes_ref_str[5:7])
    mes_label = f"{MESES_PT[m]} {y}"

    # ── Título + toggle ───────────────────────────────────────────────────────
    _title_col, _toggle_col = st.columns([4, 1], gap="small")
    with _title_col:
        st.markdown(
            f'<div style="font-size:22px;font-weight:800;color:#E8ECF2;'
            f'padding-bottom:4px;display:flex;align-items:center;">'
            f'{ui.page_icon("calendar")}Despesas</div>'
            f'<div style="font-size:12.5px;color:#4E5768;margin-bottom:10px;">'
            f'{mes_label}</div>',
            unsafe_allow_html=True,
        )
    with _toggle_col:
        modo = st.radio(
            "Modo",
            ["Mensal", "Anual"],
            horizontal=True,
            key="desp_modo",
            label_visibility="collapsed",
        )

    # ── Modo Anual ────────────────────────────────────────────────────────────
    if modo == "Anual":
        _render_anual(mes_ref_str)
        return

    # ── Modo Mensal ───────────────────────────────────────────────────────────
    abas = db_g.list_abas()
    if not abas:
        st.info("Nenhuma aba de despesa configurada. Vá em ⚙️ Configurações → Abas.")
        return

    cats_nomes = db_g.nomes_categorias()

    # Totais por aba para subtítulo nas tabs
    tab_labels = []
    for aba in abas:
        total_aba = db_g.total_despesas_aba_mes(aba["id"], mes_ref_str)
        tab_labels.append(
            f"{aba['icon']} {aba['nome']} · {ui.fmt_brl(total_aba)}"
        )

    tabs = st.tabs(tab_labels)
    for idx, (tab, aba) in enumerate(zip(tabs, abas)):
        with tab:
            _render_aba_mensal(aba, mes_ref_str, cats_nomes)

    # ── Orçamentos — configurar metas ─────────────────────────────────────────
    with st.expander("🎯 Configurar Metas de Orçamento", expanded=False):
        _aba_orc = st.selectbox(
            "Aba",
            options=[a["id"] for a in abas],
            format_func=lambda aid: next(
                (a["nome"] for a in abas if a["id"] == aid), str(aid)
            ),
            key="orc_aba_sel",
        )
        _cats = db_g.nomes_categorias()
        _orc_cat = st.selectbox("Categoria", _cats, key="orc_cat_sel")
        _orc_val = st.number_input(
            "Meta mensal (R$)", min_value=0.01, step=50.0,
            format="%.2f", key="orc_val_in",
        )
        _orc_mensal_toggle = st.radio(
            "Aplicar a",
            ["Apenas este mês", "Todos os meses (padrão)"],
            horizontal=True,
            key="orc_tipo",
        )
        if st.button("Salvar Meta", icon=":material/save:", key="btn_salvar_orc"):
            mr_param = mes_ref_str if _orc_mensal_toggle == "Apenas este mês" else None
            db_g.upsert_orcamento(_aba_orc, _orc_cat, _orc_val, mr_param)
            st.success("Meta salva!")
            st.rerun()
