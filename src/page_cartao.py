# -*- coding: utf-8 -*-
"""Página Cartão de Crédito — embeds lógica do Analista de Faturas."""

import threading
import time
from pathlib import Path

import pandas as pd
import streamlit as st

from src import charts, database, ui
from src import database_acompanhamento as db_acomp
from src import metrics_acompanhamento as metrics
from src.agent import analyze_extrato_parcial, analyze_invoice, get_configured_model
from src.database import CATEGORIAS
from src.image_extractor import extract_text_from_multiple
from src.pdf_extractor import archive_pdf, extract_text

ROOT = Path(__file__).resolve().parent.parent

# ── Cores por banco ────────────────────────────────────────────────────────────
_BANK_COLORS: dict[str, str] = {
    "itau": "#FF6B00", "itaú": "#FF6B00",
    "nubank": "#8A05BE", "bradesco": "#CC0000",
    "santander": "#EC0000", "caixa": "#006CB5",
    "inter": "#FF7A00", "c6": "#FFD700",
    "btg": "#003B70", "xp": "#1C1C1C",
    "picpay": "#21C25E", "next": "#00FF88",
    "pan": "#0070CC", "original": "#00C06B",
    "neon": "#7B2FBE", "will": "#4CAF50",
    "mercado pago": "#009EE3", "pagseguro": "#F7941D",
    "sicoob": "#008542", "sicredi": "#006633",
    "banco do brasil": "#FFCC00", "bb ": "#FFCC00",
}

ALERT_LEVEL = {
    "gasto_atipico": "warn", "duplicidade": "warn",
    "recorrencia_nova": "warn", "aumento": "warn",
    "parcelamento_longo": "parcela", "outro": "warn",
}


def _banco_cor(nome: str) -> str:
    n = nome.lower()
    for k, v in _BANK_COLORS.items():
        if k in n:
            return v
    return "#10F5A3"


def _fmt_month(m: str) -> str:
    m = m.strip().replace("-", "/")
    parts = m.split("/")
    if len(parts) == 2:
        mes = parts[0].zfill(2)
        ano = parts[1]
        if len(ano) == 2:
            ano = "20" + ano
        return f"{mes}/{ano}"
    return m


# ── Renderiza resultado de análise IA ─────────────────────────────────────────
def _render_analise(analise: dict, key_prefix: str = "analise",
                    fatura_id: int | None = None) -> None:
    fatura = analise.get("fatura", {}) or {}
    transacoes = analise.get("transacoes", []) or []
    resumo = analise.get("resumo_categorias", []) or []
    alertas = analise.get("alertas", []) or []
    recs = analise.get("recomendacoes", []) or []
    comentario = analise.get("comentario_executivo") or ""

    total = fatura.get("total")
    limite = fatura.get("limite")
    util_pct = (total / limite * 100) if (limite and total) else None
    util_sub = f"{util_pct:.1f}% do limite" if util_pct is not None else None

    items = [
        ("Banco", fatura.get("banco") or "—", None),
        ("Mês de referência", fatura.get("mes_referencia") or "—", None),
        ("Vencimento", fatura.get("vencimento") or "—", None),
        ("Total da fatura", ui.fmt_brl(total), util_sub),
        ("Transações", str(len(transacoes)), f"em {len(resumo)} categorias"),
    ]
    ui.glow_kpi_box("Indicadores da Fatura", items)

    if comentario:
        ui.section("Resumo Executivo")
        ui.exec_summary(comentario)

    if alertas:
        ui.section(f"Alertas ({len(alertas)})")
        for a in alertas:
            tipo = a.get("tipo", "outro")
            ui.alert_line(
                text=a.get("mensagem", ""),
                valor=ui.fmt_brl(a.get("valor")) if a.get("valor") else None,
                level=ALERT_LEVEL.get(tipo, "warn"),
            )

    if resumo:
        ui.section("Gastos por Categoria", color="#B07AFF")
        ui.progress_categorias(resumo, single_color="#B07AFF")

    ui.section("Top Estabelecimentos", color="#10F5A3")
    ui.progress_top_estabelecimentos(transacoes)

    if recs:
        ui.section("Recomendações")
        items_html = "".join(
            f'<div style="padding:8px 0;border-bottom:1px solid #1F2530;'
            f'color:#C8CDD6;font-size:14px;">'
            f'<span style="color:#10F5A3;margin-right:8px;">▸</span>{r}</div>'
            for r in recs
        )
        st.markdown(f'<div class="af-card">{items_html}</div>', unsafe_allow_html=True)

    edit_key = f"edit_{key_prefix}"
    if fatura_id is not None:
        df_db = database.get_transacoes_fatura_df(fatura_id)
        n_tx = len(df_db)
    else:
        df_db = pd.DataFrame()
        n_tx = len(transacoes)

    col_sec, col_btn = st.columns([5, 1])
    with col_sec:
        ui.section(f"Transações ({n_tx})")
    with col_btn:
        st.markdown('<div style="margin-top:14px;"></div>', unsafe_allow_html=True)
        if fatura_id is not None:
            if not st.session_state.get(edit_key):
                if st.button("Editar Categorias", icon=":material/edit:",
                             key=f"btn_edit_{key_prefix}",
                             use_container_width=True):
                    st.session_state[edit_key] = True
                    st.rerun()
            else:
                if st.button("Cancelar", icon=":material/close:", key=f"btn_cancel_{key_prefix}",
                             use_container_width=True):
                    st.session_state[edit_key] = False
                    st.rerun()

    if fatura_id is not None and st.session_state.get(edit_key) and not df_db.empty:
        original_cats = dict(zip(df_db["id"], df_db["categoria"]))
        df_edit = df_db.copy()
        df_edit["valor"] = df_edit["valor"].map(ui.fmt_brl)
        df_indexed = df_edit.set_index("id")[
            ["data", "estabelecimento", "descricao", "categoria", "parcela", "valor"]
        ]
        non_edit_cols = [c for c in df_indexed.columns if c != "categoria"]
        edited = st.data_editor(
            df_indexed,
            column_config={"categoria": st.column_config.SelectboxColumn(
                "Categoria", options=CATEGORIAS, required=True,
            )},
            disabled=non_edit_cols, hide_index=True,
            use_container_width=True, key=f"editor_{key_prefix}", height=400,
        )
        save_as_rule = st.checkbox(
            "Salvar mudanças como regras automáticas",
            key=f"rule_chk_{key_prefix}",
        )
        col_a, col_b, col_rules = st.columns([1, 1, 3])
        with col_a:
            if st.button("Atualizar", icon=":material/check:", key=f"btn_upd_{key_prefix}",
                         type="primary", use_container_width=True):
                changes: dict = {}
                for tx_id, row in edited.iterrows():
                    new_cat = row.get("categoria")
                    if new_cat and new_cat != original_cats.get(tx_id):
                        changes[tx_id] = new_cat
                if changes:
                    database.bulk_update_categories(changes)
                    if save_as_rule:
                        id_to_desc = dict(zip(df_db["id"], df_db["descricao"]))
                        for tx_id, new_cat in changes.items():
                            desc = id_to_desc.get(tx_id, "")
                            if desc:
                                database.add_category_rule(str(desc), new_cat)
                    database.rebuild_analise_json(fatura_id)
                    st.toast(f"{len(changes)} categoria(s) atualizada(s).")
                st.session_state[edit_key] = False
                st.rerun()
        with col_rules:
            rules = database.get_category_rules()
            if rules:
                with st.expander(f"Regras salvas ({len(rules)})", icon=":material/bookmark:"):
                    for rule in rules:
                        rc1, rc2 = st.columns([5, 1])
                        with rc1:
                            st.markdown(
                                f'<span style="color:#C8CDD6;font-size:12px;">'
                                f'"{rule["pattern"]}" → '
                                f'<b style="color:#10F5A3;">{rule["categoria"]}</b></span>',
                                unsafe_allow_html=True,
                            )
                        with rc2:
                            if st.button("", icon=":material/delete:", key=f"del_rule_{rule['id']}_{key_prefix}"):
                                database.delete_category_rule(rule["id"])
                                st.rerun()
    else:
        if fatura_id is not None and not df_db.empty:
            df_show = df_db[
                ["data", "estabelecimento", "descricao", "categoria", "parcela", "valor"]
            ].copy()
            df_show["valor"] = df_show["valor"].map(ui.fmt_brl)
        elif transacoes:
            df_show = pd.DataFrame(transacoes)
            show_cols = [c for c in
                         ["data", "estabelecimento", "descricao", "categoria", "parcela", "valor"]
                         if c in df_show.columns]
            df_show = df_show[show_cols].copy()
            if "valor" in df_show.columns:
                df_show["valor"] = df_show["valor"].map(ui.fmt_brl)
        else:
            df_show = pd.DataFrame()
        if not df_show.empty:
            st.dataframe(df_show, use_container_width=True, hide_index=True, height=400)


# ══════════════════════════════════════════════════════════════════════════════
# RENDER PRINCIPAL
# ══════════════════════════════════════════════════════════════════════════════
def render() -> None:
    cartoes_all = database.list_cartoes()
    _active_card_ids = [c["id"] for c in cartoes_all if c["ativo"] and c["id"] != 1]

    df_hist = database.list_faturas()
    df_tx_all = database.all_transacoes()
    if _active_card_ids:
        if not df_hist.empty:
            df_hist = df_hist[df_hist["cartao_id"].isin(_active_card_ids)]
        if not df_tx_all.empty:
            df_tx_all = df_tx_all[df_tx_all["cartao_id"].isin(_active_card_ids)]
    else:
        df_hist = df_hist.head(0)
        df_tx_all = df_tx_all.head(0)

    n_faturas = len(df_hist)
    n_trans = len(df_tx_all)
    total_acum = (df_tx_all[df_tx_all["valor"] > 0]["valor"].sum()
                  if not df_tx_all.empty else 0.0)

    # ── Título ────────────────────────────────────────────────────────────────
    st.markdown(
        '<div style="font-size:22px;font-weight:800;color:#E8ECF2;padding-bottom:4px;'
        'display:flex;align-items:center;">'
        f'{ui.page_icon("credit")}Cartão de Crédito</div>'
        '<div style="font-size:12.5px;color:#4E5768;margin-bottom:18px;">'
        'Análise de faturas via IA · Acompanhamento do ciclo em aberto · Tendências</div>',
        unsafe_allow_html=True,
    )

    # ── Upload de fatura completa (PDF) ───────────────────────────────────────
    _cartoes_upload = [c for c in cartoes_all if c["ativo"] and c["id"] != 1]
    with st.expander("📤 Analisar Nova Fatura (PDF)", expanded=False):
        _up_col1, _up_col2, _up_col3 = st.columns([3, 2, 2], gap="small")
        with _up_col1:
            uploaded = st.file_uploader(
                "PDF da fatura", type=["pdf"],
                key="uploader_main", label_visibility="collapsed",
            )
        with _up_col2:
            import datetime
            default_month = datetime.datetime.now().strftime("%m/%Y")
            mes_input = st.text_input(
                "Mês apurado", value=default_month,
                help="Formato MM/AAAA", key="mes_input_main",
            )
        with _up_col3:
            if _cartoes_upload:
                _up_cartao_idx = st.selectbox(
                    "Cartão", range(len(_cartoes_upload)),
                    format_func=lambda i: (
                        f"{_cartoes_upload[i]['nome']}"
                        + (f" ···{_cartoes_upload[i]['final_digitos']}"
                           if _cartoes_upload[i]["final_digitos"] else "")
                    ),
                    key="upload_cartao_sel",
                )
                _upload_cartao_id = _cartoes_upload[_up_cartao_idx]["id"]
            else:
                _upload_cartao_id = 1
                st.caption("Nenhum cartão cadastrado.")

        run_pdf = st.button(
            ":material/auto_awesome: Analisar Fatura",
            type="primary", use_container_width=True,
            disabled=(uploaded is None),
            key="btn_analisar_fatura",
        )

        if run_pdf and uploaded is not None:
            pdf_bytes = uploaded.getvalue()
            try:
                text, file_hash = extract_text(pdf_bytes)
            except Exception as exc:
                st.error(f"Falha ao ler PDF: {exc}")
                st.stop()

            cached = database.get_by_hash(file_hash)
            if cached:
                st.info("Fatura já analisada — selecionada no histórico.")
                st.session_state["selected_fatura_id"] = cached.get("id")
                st.rerun()
            else:
                result: dict = {}

                # Carrega histórico do mesmo cartão para o Relator
                _historico_cartao: list[dict] = []
                try:
                    import json as _json
                    _fat_hist = database.list_faturas(cartao_id=_upload_cartao_id)
                    for _, row in _fat_hist.iterrows():
                        _fat_data = database.get_fatura(int(row["id"]))
                        if _fat_data:
                            _historico_cartao.append(_fat_data)
                except Exception:
                    pass  # histórico indisponível — relator usa só dados atuais

                def _worker_pdf() -> None:
                    try:
                        result["analise"] = analyze_invoice(
                            text, historico=_historico_cartao
                        )
                    except Exception as e:
                        result["error"] = e

                t = threading.Thread(target=_worker_pdf, daemon=True)
                t.start()
                ph = st.empty()
                start = time.time()
                while t.is_alive():
                    elapsed = int(time.time() - start)
                    ph.markdown(
                        f'<div class="af-glow"><div class="af-glow-title">Processando</div>'
                        f'<div style="font-size:32px;font-weight:800;color:#10F5A3;">'
                        f'{elapsed}s</div></div>',
                        unsafe_allow_html=True,
                    )
                    time.sleep(1)
                t.join()
                ph.empty()

                if "error" in result:
                    st.error(f"Erro do agente: {result['error']}")
                    st.stop()

                analise = result["analise"]
                if mes_input:
                    analise.setdefault("fatura", {})
                    analise["fatura"]["mes_referencia"] = _fmt_month(mes_input)

                # Exibe warnings do QA (não são erros — apenas avisos)
                for _w in analise.get("qa_warnings") or []:
                    st.warning(f"⚠️ QA: {_w}")

                pdf_path = archive_pdf(pdf_bytes, file_hash, uploaded.name,
                                       ROOT / "data" / "pdfs")
                fatura_id = database.save_analysis(
                    file_hash=file_hash,
                    arquivo_original=uploaded.name,
                    pdf_path=str(pdf_path),
                    analise=analise,
                    cartao_id=_upload_cartao_id,
                )
                st.success(f"Análise concluída em {int(time.time()-start)}s (#{fatura_id}).")
                st.session_state["selected_fatura_id"] = fatura_id
                st.rerun()

    # ── Sem cartões ───────────────────────────────────────────────────────────
    _strip_ativos = [c for c in cartoes_all if c["ativo"] and c["id"] != 1]
    if not _strip_ativos:
        st.markdown(
            '<div class="af-card" style="text-align:center;padding:64px 40px;margin-top:24px;">'
            '<div style="font-size:44px;margin-bottom:16px;">💳</div>'
            '<div style="font-size:20px;font-weight:700;color:#E8ECF2;margin-bottom:10px;">'
            'Nenhum cartão cadastrado</div>'
            '<div style="font-size:14px;color:#8B92A0;line-height:1.8;">'
            'Vá em <b style="color:#E8ECF2;">⚙️ Configurações → 💳 Cartões</b> '
            'para adicionar seu cartão.</div>'
            '</div>',
            unsafe_allow_html=True,
        )
        return

    # ── Chip strip ────────────────────────────────────────────────────────────
    if "acomp_view_radio" not in st.session_state:
        st.session_state["acomp_view_radio"] = 1 if len(_strip_ativos) == 1 else 0

    _cur_chip_sel = st.session_state.get("acomp_view_radio", 0)
    _multi_card = len(_strip_ativos) > 1

    _chip_css_rules: list[str] = []
    if _multi_card:
        _active_todos = _cur_chip_sel == 0
        _chip_css_rules.append(
            '.element-container:has(.af-chip-todos) + .element-container button {'
            + ('background:#10F5A322!important;border:1px solid #10F5A399!important;'
               'color:#10F5A3!important;font-weight:700!important;'
               'box-shadow:0 0 12px #10F5A344!important;'
               if _active_todos else
               'background:transparent!important;border:1px solid #1F2530!important;'
               'color:#8B92A0!important;')
            + '}'
        )
    for _i, _sc in enumerate(_strip_ativos):
        _sc_cor = _sc.get("cor") or _banco_cor(_sc["nome"])
        _cid = _sc["id"]
        _is_active = (_cur_chip_sel == _i + 1)
        _chip_css_rules.append(
            f'.element-container:has(.af-chip-c{_cid}) + .element-container button {{'
            + (f'background:{_sc_cor}22!important;border:1px solid {_sc_cor}99!important;'
               f'color:#E8ECF2!important;font-weight:700!important;'
               f'box-shadow:0 0 12px {_sc_cor}44!important;'
               if _is_active else
               f'background:{_sc_cor}0C!important;border:1px solid {_sc_cor}44!important;'
               f'color:#8B92A0!important;')
            + '}'
        )
    if _chip_css_rules:
        st.markdown(f'<style>{"".join(_chip_css_rules)}</style>', unsafe_allow_html=True)

    _n_chips = len(_strip_ativos) + (1 if _multi_card else 0)
    _chip_cols = st.columns([1] * _n_chips + [max(2, 6 - _n_chips)], gap="small")
    _col_off = 0

    if _multi_card:
        with _chip_cols[0]:
            st.markdown('<span class="af-chip-todos"></span>', unsafe_allow_html=True)
            if st.button("🗂 Todos", key="chip_todos", use_container_width=True):
                st.session_state["acomp_view_radio"] = 0
                st.rerun()
        _col_off = 1

    for _i, _sc in enumerate(_strip_ativos):
        _sc_label = _sc["nome"]
        if _sc.get("final_digitos"):
            _sc_label += f" ···{_sc['final_digitos']}"
        with _chip_cols[_col_off + _i]:
            st.markdown(f'<span class="af-chip-c{_sc["id"]}"></span>',
                        unsafe_allow_html=True)
            if st.button(_sc_label, key=f"chip_c{_sc['id']}",
                         use_container_width=True,
                         help=_sc.get("proprietario") or None):
                st.session_state["acomp_view_radio"] = _i + 1
                st.rerun()

    # ── Tabs ──────────────────────────────────────────────────────────────────
    if "uploader_reset_key" not in st.session_state:
        st.session_state["uploader_reset_key"] = 0

    tab_acomp, tab_hist, tab_trend = st.tabs([
        ":material/calendar_month: Acompanhamento do Mês",
        ":material/history: Histórico & Análise",
        ":material/trending_up: Tendências",
    ])

    # ─────────────────────────────────────────────────────────────────────────
    # TAB 1: ACOMPANHAMENTO DO MÊS
    # ─────────────────────────────────────────────────────────────────────────
    with tab_acomp:
        info = db_acomp.info_ciclo()
        inicio_fmt = info["inicio"].strftime("%d/%m/%Y")
        fim_fmt = info["fim"].strftime("%d/%m/%Y")

        _cartoes_ativos = [c for c in cartoes_all if c["ativo"] and c["id"] != 1]
        _view_idx = st.session_state.get("acomp_view_radio", 0)
        _acomp_cartao = (
            _cartoes_ativos[_view_idx - 1]
            if _view_idx > 0 and _view_idx <= len(_cartoes_ativos)
            else None
        )
        _acomp_cartao_id = _acomp_cartao["id"] if _acomp_cartao else None

        if _acomp_cartao_id is None:
            _limite_disp = (
                sum(c["limite"] or 0 for c in _cartoes_ativos)
                or db_acomp.get_limite()
            )
        else:
            _limite_disp = _acomp_cartao.get("limite") or db_acomp.get_limite()

        st.markdown(
            f'<div style="display:flex;justify-content:space-between;'
            f'align-items:center;margin-bottom:14px;">'
            f'<div>'
            f'<div style="font-size:11px;letter-spacing:0.7px;color:#8B92A0;'
            f'text-transform:uppercase;font-weight:600;">Ciclo aberto</div>'
            f'<div style="font-size:20px;color:#E8ECF2;font-weight:700;">'
            f'{inicio_fmt} → {fim_fmt}</div>'
            f'</div>'
            f'<div style="text-align:center;">'
            f'<div style="font-size:11px;letter-spacing:0.7px;color:#8B92A0;'
            f'text-transform:uppercase;font-weight:600;">Limite</div>'
            f'<div style="font-size:20px;color:#E8ECF2;font-weight:700;">'
            f'{ui.fmt_brl(_limite_disp)}</div>'
            f'</div>'
            f'<div style="text-align:right;">'
            f'<div style="font-size:11px;letter-spacing:0.7px;color:#8B92A0;'
            f'text-transform:uppercase;font-weight:600;">'
            f'Dia {info["decorridos"]} de {info["total_dias"]}</div>'
            f'<div style="font-size:20px;color:#10F5A3;font-weight:700;">'
            f'{info["restantes"]} dias restantes</div>'
            f'</div>'
            f'</div>',
            unsafe_allow_html=True,
        )

        # Upload de prints / extrato parcial
        st.markdown(
            '<div style="font-size:13px;color:#8B92A0;margin-bottom:6px;">'
            'Prints do app do banco ou PDF do extrato parcial</div>',
            unsafe_allow_html=True,
        )
        _ocr_cartao_id = _acomp_cartao_id or (
            _cartoes_ativos[0]["id"] if _cartoes_ativos else 1
        )
        if len(_cartoes_ativos) > 1:
            _ocr_c_idx = st.selectbox(
                "Cartão do upload",
                range(len(_cartoes_ativos)),
                format_func=lambda i: (
                    f"{_cartoes_ativos[i]['nome']}"
                    + (f" ···{_cartoes_ativos[i]['final_digitos']}"
                       if _cartoes_ativos[i]["final_digitos"] else "")
                ),
                index=max(0, _view_idx - 1),
                key="ocr_cartao_sel",
            )
            _ocr_cartao_id = _cartoes_ativos[_ocr_c_idx]["id"]

        _up_col, _btn_col = st.columns([5, 1], vertical_alignment="center")
        with _up_col:
            prints = st.file_uploader(
                "upload", type=["png", "jpg", "jpeg", "pdf"],
                accept_multiple_files=True,
                key=f"prints_uploader_{st.session_state['uploader_reset_key']}",
                label_visibility="collapsed",
            )
        with _btn_col:
            st.markdown('<div class="af-btn-ghost-marker"></div>', unsafe_allow_html=True)
            run_ocr = st.button(
                ":material/auto_awesome: Analisar",
                disabled=(not prints), key="btn_ocr", use_container_width=True,
            )

        if run_ocr and prints:
            images_bytes = [p.getvalue() for p in prints
                            if not p.name.lower().endswith(".pdf")]
            pdf_files = [p.getvalue() for p in prints
                         if p.name.lower().endswith(".pdf")]
            proc_ph = st.empty()
            texto_parts: list[str] = []
            if images_bytes:
                proc_ph.info(f"⏳ OCR de {len(images_bytes)} imagem(ns)...")
                try:
                    txt_img = extract_text_from_multiple(images_bytes)
                    if txt_img:
                        texto_parts.append(txt_img)
                except Exception as exc:
                    proc_ph.error(f"Falha no OCR: {exc}")
                    st.stop()
            if pdf_files:
                proc_ph.info(f"⏳ Extraindo texto de {len(pdf_files)} PDF(s)...")
                try:
                    for pdf_b in pdf_files:
                        txt_pdf, _ = extract_text(pdf_b)
                        if txt_pdf:
                            texto_parts.append(txt_pdf)
                except Exception as exc:
                    proc_ph.error(f"Falha ao ler PDF: {exc}")
                    st.stop()
            proc_ph.empty()
            texto = "\n\n".join(texto_parts)
            if not texto or len(texto) < 30:
                st.error("Texto insuficiente. Tente arquivos mais nítidos.")
                st.stop()
            st.success(f"Extração ok — {len(texto)} chars. Analisando com IA...")
            result2: dict = {}

            def _worker_ocr() -> None:
                try:
                    result2["analise"] = analyze_extrato_parcial(texto)
                except Exception as e:
                    result2["error"] = e

            t2 = threading.Thread(target=_worker_ocr, daemon=True)
            t2.start()
            ph2 = st.empty()
            st0 = time.time()
            while t2.is_alive():
                ph2.markdown(
                    f'<div class="af-glow"><div class="af-glow-title">Processando</div>'
                    f'<div style="font-size:32px;font-weight:800;color:#10F5A3;">'
                    f'{int(time.time()-st0)}s</div></div>',
                    unsafe_allow_html=True,
                )
                time.sleep(1)
            t2.join()
            ph2.empty()
            if "error" in result2:
                st.error(f"Erro do agente: {result2['error']}")
                st.stop()
            snap_id = db_acomp.add_snapshot(result2["analise"],
                                            cartao_id=_ocr_cartao_id)
            from src import database_gestao as db_g
            db_g.sync_cartao_ciclo(_ocr_cartao_id)
            st.success(f"Snapshot #{snap_id} salvo.")
            st.session_state["uploader_reset_key"] += 1
            st.rerun()

        # Snapshot atual
        if _acomp_cartao_id is None:
            snap = db_acomp.latest_snapshot_combined(
                valid_cartao_ids=_active_card_ids)
            snap_prev = db_acomp.previous_snapshot_combined(
                valid_cartao_ids=_active_card_ids)
        else:
            snap = db_acomp.latest_snapshot(cartao_id=_acomp_cartao_id)
            snap_prev = db_acomp.previous_snapshot(cartao_id=_acomp_cartao_id)

        if not snap:
            st.markdown(
                '<div class="af-card" style="text-align:center;padding:40px;margin-top:8px;">'
                '<div style="color:#C8CDD6;font-size:15px;font-weight:600;">'
                'Nenhum snapshot do ciclo atual</div>'
                '<div style="color:#8B92A0;font-size:13px;margin-top:4px;">'
                'Suba prints ou PDF parcial e clique em Analisar.</div></div>',
                unsafe_allow_html=True,
            )
        else:
            gasto = float(snap.get("total") or 0)
            limite = _limite_disp
            pace = metrics.pace_indicator(gasto, limite, info["pct_tempo"])
            forecast = metrics.forecast_fechamento(
                gasto, info["decorridos"], info["total_dias"])
            daily = metrics.daily_allowance(gasto, limite, info["restantes"])
            velocidade = metrics.velocidade_diaria(gasto, info["decorridos"])
            comp = metrics.comparativo_snapshots(snap, snap_prev)

            status_label = {
                "no_ritmo": "No ritmo", "folga": "Folga",
                "atencao": "Atenção", "adiantado": "Estourando",
            }.get(pace.status, pace.status)

            forecast_pct = (forecast / limite * 100) if limite > 0 else 0
            forecast_color = "#FF6B7A" if forecast > limite else "#10F5A3"

            ui.section("Limite do Ciclo", color=pace.color)
            ui.big_progress_bar(gasto, limite, color=pace.color,
                                data_upload=snap.get("data_upload"))

            ui.glow_kpi_box("Indicadores do Ciclo", [
                ("Pace", f'<span style="color:{pace.color}">{status_label}</span>',
                 f"gasto {pace.pct_gasto:.0f}% · tempo {pace.pct_tempo:.0f}%"),
                ("Forecast fechamento",
                 f'<span style="color:{forecast_color}">{ui.fmt_brl(forecast)}</span>',
                 f"{forecast_pct:.0f}% do limite"),
                ("Pode gastar/dia",
                 ui.fmt_brl(daily) if daily is not None else "—",
                 f"nos próximos {info['restantes']} dias"),
                ("Ritmo atual", ui.fmt_brl(velocidade), "por dia decorrido"),
                ("Transações", str(snap.get("qtd_transacoes", 0)), None),
            ])

            if comp:
                sinal = "▲" if comp["delta_total"] > 0 else (
                    "▼" if comp["delta_total"] < 0 else "—")
                cor = "#FF6B7A" if comp["delta_total"] > 0 else "#10F5A3"
                ui.section("Comparativo com snapshot anterior", color="#6FA9D6")
                st.markdown(
                    f'<div class="af-card" style="border-left:3px solid #6FA9D6;">'
                    f'<div style="color:#C8CDD6;font-size:14px;">'
                    f'<span style="color:{cor};font-weight:700;">'
                    f'{sinal} {ui.fmt_brl(abs(comp["delta_total"]))}</span>'
                    f'</div></div>',
                    unsafe_allow_html=True,
                )

            analise_dados = snap.get("dados", {})
            resumo = analise_dados.get("resumo_categorias", []) or []
            if resumo:
                ui.section("Gastos por Categoria no Ciclo", color="#B07AFF")
                ui.progress_categorias(resumo, single_color="#B07AFF")

            transacoes = analise_dados.get("transacoes", []) or []
            snap_id_val = snap.get("id")
            acomp_edit_key = "acomp_edit_mode"
            if transacoes:
                col_sec_a, col_btn_a = st.columns([5, 1])
                with col_sec_a:
                    ui.section(f"Transações detectadas ({len(transacoes)})")
                with col_btn_a:
                    st.markdown('<div style="margin-top:14px;"></div>', unsafe_allow_html=True)
                    if snap_id_val is not None:
                        if not st.session_state.get(acomp_edit_key):
                            if st.button("Editar", icon=":material/edit:", key="btn_edit_acomp",
                                         use_container_width=True):
                                st.session_state[acomp_edit_key] = True
                                st.rerun()
                        else:
                            if st.button("Cancelar", icon=":material/close:", key="btn_cancel_acomp",
                                         use_container_width=True):
                                st.session_state[acomp_edit_key] = False
                                st.rerun()

                if st.session_state.get(acomp_edit_key) and snap_id_val:
                    df_acomp = (
                        pd.DataFrame(transacoes)
                        .reset_index()
                        .rename(columns={"index": "_idx"})
                    )
                    _base_cols = ["data", "estabelecimento", "descricao",
                                  "categoria", "valor"]
                    acomp_cols = [c for c in _base_cols if c in df_acomp.columns]
                    df_acomp_disp = df_acomp.set_index("_idx")[acomp_cols].copy()
                    if "valor" in df_acomp_disp.columns:
                        df_acomp_disp["valor"] = df_acomp_disp["valor"].map(ui.fmt_brl)
                    orig_cats_acomp = {
                        i: t.get("categoria", "") for i, t in enumerate(transacoes)
                    }
                    non_edit_acomp = [
                        c for c in df_acomp_disp.columns if c != "categoria"
                    ]
                    edited_acomp = st.data_editor(
                        df_acomp_disp,
                        column_config={"categoria": st.column_config.SelectboxColumn(
                            "Categoria", options=CATEGORIAS, required=True,
                        )},
                        disabled=non_edit_acomp, hide_index=True,
                        use_container_width=True, key="editor_acomp", height=300,
                    )
                    col_aa, _, col_rules_a = st.columns([1, 1, 3])
                    with col_aa:
                        if st.button("Atualizar", icon=":material/check:", key="btn_upd_acomp",
                                     type="primary", use_container_width=True):
                            changes_acomp: dict = {}
                            for idx, row in edited_acomp.iterrows():
                                new_cat = row.get("categoria")
                                if new_cat and new_cat != orig_cats_acomp.get(idx):
                                    changes_acomp[idx] = new_cat
                            if changes_acomp:
                                db_acomp.update_snapshot_categories(
                                    snap_id_val, changes_acomp)
                                st.toast(f"{len(changes_acomp)} categoria(s) atualizada(s).")
                            st.session_state[acomp_edit_key] = False
                            st.rerun()
                else:
                    df_tx = pd.DataFrame(transacoes)
                    _show_cols = ["data", "estabelecimento", "descricao",
                                  "categoria", "valor"]
                    if "_cartao_id" in df_tx.columns:
                        _cid_map = {
                            c["id"]: c["nome"] + (
                                f" ···{c['final_digitos']}"
                                if c.get("final_digitos") else "")
                            for c in cartoes_all
                        }
                        df_tx["cartão"] = df_tx["_cartao_id"].map(_cid_map)
                        _show_cols = ["cartão"] + [
                            col for col in _show_cols if col != "cartão"
                        ]
                    tx_cols = [c for c in _show_cols if c in df_tx.columns]
                    df_tx = df_tx[tx_cols].copy()
                    if "valor" in df_tx.columns:
                        df_tx["valor"] = df_tx["valor"].map(ui.fmt_brl)
                    st.dataframe(df_tx, use_container_width=True, hide_index=True,
                                 height=300)

    # ─────────────────────────────────────────────────────────────────────────
    # TAB 2: HISTÓRICO & ANÁLISE
    # ─────────────────────────────────────────────────────────────────────────
    with tab_hist:
        if df_hist.empty:
            st.markdown(
                '<div class="af-card" style="text-align:center;padding:40px;">'
                '<div style="color:#C8CDD6;font-size:15px;font-weight:600;">'
                'Nenhuma fatura analisada ainda</div>'
                '<div style="color:#8B92A0;font-size:13px;margin-top:4px;">'
                'Abra o expander acima e envie um PDF para começar.</div>'
                '</div>',
                unsafe_allow_html=True,
            )
        else:
            ui.section(f"Histórico ({n_faturas} faturas · {n_trans} transações)")
            _strip_pool = [c for c in cartoes_all if c["ativo"] and c["id"] != 1]
            _strip_view = st.session_state.get("acomp_view_radio", 0)
            _hist_cartao_id = (
                _strip_pool[_strip_view - 1]["id"]
                if _strip_view > 0 and _strip_view <= len(_strip_pool)
                else None
            )
            df_hist_f = (
                df_hist[df_hist["cartao_id"] == _hist_cartao_id]
                if _hist_cartao_id else df_hist
            )

            if _hist_cartao_id is None:
                st.markdown(
                    '<div class="af-card" style="text-align:center;padding:32px;">'
                    '<div style="color:#8B92A0;font-size:13px;">'
                    'Selecione um cartão no chip strip para ver análise detalhada.</div>'
                    '</div>',
                    unsafe_allow_html=True,
                )
            else:
                ids = df_hist_f["id"].tolist()
                labels = [
                    f"{r.banco or '?'} — {r.mes_referencia or '?'}"
                    for r in df_hist_f.itertuples()
                ]
                if not ids:
                    st.markdown(
                        '<div class="af-card" style="text-align:center;padding:32px;">'
                        '<div style="color:#8B92A0;font-size:13px;">'
                        'Nenhuma fatura para este cartão.</div></div>',
                        unsafe_allow_html=True,
                    )
                else:
                    default_idx = 0
                    if "selected_fatura_id" in st.session_state:
                        sid = st.session_state["selected_fatura_id"]
                        if sid in ids:
                            default_idx = ids.index(sid)
                    sel = st.selectbox(
                        "Escolher fatura",
                        options=range(len(ids)),
                        format_func=lambda i: labels[i],
                        index=default_idx,
                        key="hist_selector",
                    )
                    if sel is not None:
                        fatura_id = int(ids[sel])
                        analise = database.get_fatura(fatura_id)
                        if analise:
                            st.markdown('<div style="height:8px;"></div>',
                                        unsafe_allow_html=True)
                            _render_analise(analise,
                                            key_prefix=f"hist_{fatura_id}",
                                            fatura_id=fatura_id)
                            if st.button("Excluir esta fatura do histórico",
                                         type="secondary"):
                                database.delete_fatura(fatura_id)
                                if "selected_fatura_id" in st.session_state:
                                    del st.session_state["selected_fatura_id"]
                                st.rerun()

    # ─────────────────────────────────────────────────────────────────────────
    # TAB 3: TENDÊNCIAS
    # ─────────────────────────────────────────────────────────────────────────
    with tab_trend:
        _tr_pool = [c for c in cartoes_all if c["ativo"] and c["id"] != 1]
        _tr_view = st.session_state.get("acomp_view_radio", 0)
        _tr_cartao_id = (
            _tr_pool[_tr_view - 1]["id"]
            if _tr_view > 0 and _tr_view <= len(_tr_pool)
            else None
        )
        df_tx_trend = (
            df_tx_all[df_tx_all["cartao_id"] == _tr_cartao_id]
            if _tr_cartao_id else df_tx_all
        )

        if df_tx_trend.empty or df_tx_trend["mes_referencia"].nunique() < 1:
            st.markdown(
                '<div class="af-card" style="text-align:center;padding:40px;">'
                '<div style="color:#C8CDD6;font-size:15px;font-weight:600;">'
                'Tendências aparecem após a primeira fatura</div>'
                '<div style="color:#8B92A0;font-size:13px;margin-top:4px;">'
                'Envie pelo menos uma fatura PDF.</div>'
                '</div>',
                unsafe_allow_html=True,
            )
        else:
            _tr_acum = df_tx_trend[df_tx_trend["valor"] > 0]["valor"].sum()
            _tr_n = len(df_tx_trend)
            if df_tx_trend["mes_referencia"].nunique() >= 2:
                meses = sorted(
                    df_tx_trend["mes_referencia"].dropna().unique(), reverse=True
                )
                cur, prev = meses[0], meses[1]
                cur_total = df_tx_trend[
                    (df_tx_trend["mes_referencia"] == cur) & (df_tx_trend["valor"] > 0)
                ]["valor"].sum()
                prev_total = df_tx_trend[
                    (df_tx_trend["mes_referencia"] == prev) & (df_tx_trend["valor"] > 0)
                ]["valor"].sum()
                delta = cur_total - prev_total
                pct = (delta / prev_total * 100) if prev_total else 0
                arrow = "▲" if delta > 0 else ("▼" if delta < 0 else "—")
                color = "#FF6B7A" if delta > 0 else "#10F5A3"
                ui.glow_kpi_box("Resumo de Tendências", [
                    ("Mês atual", cur, ui.fmt_brl(cur_total)),
                    ("Mês anterior", prev, ui.fmt_brl(prev_total)),
                    ("Variação",
                     f'<span style="color:{color}">{arrow} {ui.fmt_brl(abs(delta))}</span>',
                     f"{pct:+.1f}%"),
                    ("Soma acumulada", ui.fmt_brl(float(_tr_acum)),
                     f"{_tr_n} transações"),
                ])
            else:
                ui.glow_kpi_box("Resumo de Tendências", [
                    ("Faturas", str(n_faturas), "no histórico"),
                    ("Transações", str(_tr_n), None),
                    ("Soma acumulada", ui.fmt_brl(float(_tr_acum)), None),
                ])

            ui.section("Evolução mensal de gastos")
            st.plotly_chart(charts.line_evolucao_mensal(df_tx_trend),
                            use_container_width=True, key="tr_line_total")
            ui.section("Composição mensal por categoria")
            st.plotly_chart(charts.stacked_categorias_mensal(df_tx_trend),
                            use_container_width=True, key="tr_stack")
            ui.section("Evolução por categoria")
            st.plotly_chart(charts.line_categorias_mensal(df_tx_trend),
                            use_container_width=True, key="tr_line_cat")
