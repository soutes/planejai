# -*- coding: utf-8 -*-
"""
Substitui todos os emojis usados como icones de botoes por `:material/icon:` do Streamlit.
Executa substituicoes pontuais para nao afetar texto de conteudo.
"""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def patch(path: str, replacements: list[tuple[str, str]]) -> int:
    p = ROOT / path
    src = p.read_text(encoding="utf-8")
    original = src
    for old, new in replacements:
        src = src.replace(old, new)
    if src != original:
        p.write_text(src, encoding="utf-8")
        count = sum(1 for o, _ in replacements if o in original)
        print(f"  {p.name}: {count} substituicoes")
        return count
    print(f"  {p.name}: sem mudancas")
    return 0


# ── page_rendimentos.py ───────────────────────────────────────────────────────
patch("src/page_rendimentos.py", [
    ('if st.button("💾", key=f"rsave_{r[\'id\']}", help="Salvar"):',
     'if st.button("", icon=":material/save:", key=f"rsave_{r[\'id\']}", help="Salvar"):'),

    ('if st.button("🗑", key=f"rdel_{r[\'id\']}", help="Remover"):',
     'if st.button("", icon=":material/delete:", key=f"rdel_{r[\'id\']}", help="Remover"):'),

    ('if st.button("🗑 Confirmar", key=f"rconfirm_{r[\'id\']}",',
     'if st.button("Confirmar", icon=":material/delete:", key=f"rconfirm_{r[\'id\']}",'),

    ('if st.button("🗑 Apagar série inteira",',
     'if st.button("Apagar série inteira", icon=":material/delete:",'),
])

# ── page_despesas.py ──────────────────────────────────────────────────────────
patch("src/page_despesas.py", [
    # Badge fatura
    ('padding:1px 5px;margin-left:6px;">💳 FATURA</span>',
     'padding:1px 5px;margin-left:6px;">FATURA</span>'),

    # Total da aba — centralizar
    ('f\'<div style="display:flex;align-items:baseline;gap:12px;margin-bottom:12px;">\'',
     'f\'<div style="display:flex;align-items:baseline;justify-content:center;gap:12px;margin-bottom:12px;">\''),

    # Botao editar
    ('if st.button("✏️", key=f"dedit_{d[\'id\']}", help="Editar"):',
     'if st.button("", icon=":material/edit:", key=f"dedit_{d[\'id\']}", help="Editar"):'),

    # Botao excluir inline
    ('if st.button("🗑", key=f"ddel_{d[\'id\']}", help="Excluir"):',
     'if st.button("", icon=":material/delete:", key=f"ddel_{d[\'id\']}", help="Excluir"):'),

    # Botao salvar edicao inline
    ('if st.button("💾 Salvar", key=f"e_save_{d[\'id\']}",',
     'if st.button("Salvar", icon=":material/save:", key=f"e_save_{d[\'id\']}",'),

    # Botao cancelar edicao
    ('if st.button("✕ Cancelar", key=f"e_cancel_{d[\'id\']}"):',
     'if st.button("Cancelar", icon=":material/close:", key=f"e_cancel_{d[\'id\']}"):'),

    # Expander confirmacao exclusao
    (f'f"⚠️ Excluir \'{{d[\'descricao\']}}\\'?", expanded=True',
     f'f"Excluir \'{{d[\'descricao\']}}\\'?", icon=":material/warning:", expanded=True'),

    # Botao confirmar exclusao
    ('if st.button("🗑 Excluir", key=f"dconfirm_{d[\'id\']}",',
     'if st.button("Excluir", icon=":material/delete:", key=f"dconfirm_{d[\'id\']}",'),

    # Botao apagar serie
    ('if st.button("🗑 Apagar série",',
     'if st.button("Apagar série", icon=":material/delete:",'),

    # Expander adicionar despesa
    ('with st.expander("➕ Adicionar Despesa", expanded=(not despesas)):',
     'with st.expander("Adicionar Despesa", icon=":material/add:", expanded=(not despesas)):'),

    # Form submit
    ('"➕ Adicionar", type="primary", use_container_width=True',
     '"Adicionar", icon=":material/add:", type="primary", use_container_width=True'),

    # Salvar meta
    ('if st.button("💾 Salvar Meta", key="btn_salvar_orc"):',
     'if st.button("Salvar Meta", icon=":material/save:", key="btn_salvar_orc"):'),
])

# ── page_cartao.py ────────────────────────────────────────────────────────────
patch("src/page_cartao.py", [
    ('if st.button("✏️ Editar Categorias",',
     'if st.button("Editar Categorias", icon=":material/edit:",'),

    ('if st.button("✕ Cancelar", key=f"btn_cancel_{key_prefix}",',
     'if st.button("Cancelar", icon=":material/close:", key=f"btn_cancel_{key_prefix}",'),

    ('if st.button("✅ Atualizar", key=f"btn_upd_{key_prefix}",',
     'if st.button("Atualizar", icon=":material/check:", key=f"btn_upd_{key_prefix}",'),

    ('with st.expander(f"🔖 Regras salvas ({len(rules)})"):',
     'with st.expander(f"Regras salvas ({len(rules)})", icon=":material/bookmark:"):'),

    ('if st.button("🗑", key=f"del_rule_{rule[\'id\']}_{key_prefix}"):',
     'if st.button("", icon=":material/delete:", key=f"del_rule_{rule[\'id\']}_{key_prefix}"):'),

    ('if st.button("✏️ Editar", key="btn_edit_acomp",',
     'if st.button("Editar", icon=":material/edit:", key="btn_edit_acomp",'),

    ('if st.button("✕ Cancelar", key="btn_cancel_acomp",',
     'if st.button("Cancelar", icon=":material/close:", key="btn_cancel_acomp",'),

    ('if st.button("✅ Atualizar", key="btn_upd_acomp",',
     'if st.button("Atualizar", icon=":material/check:", key="btn_upd_acomp",'),
])

# ── app.py ────────────────────────────────────────────────────────────────────
patch("app.py", [
    # Tabs configuracoes
    ('"👥 Pessoas"', '"Pessoas"'),
    ('"📂 Abas de Despesa"', '"Abas de Despesa"'),
    ('"📌 Regras Fixas"', '"Regras Fixas"'),
    ('"🏷️ Categorias"', '"Categorias"'),
    ('"💳 Cartões"', '"Cartões"'),
    ('"⏱️ Ciclo"', '"Ciclo"'),
    ('"🤖 Agente IA"', '"Agente IA"'),

    # Botao remover pessoa
    ('if st.button("🗑️", key=f"pdel_{p[\'id\']}", help="Remover"):',
     'if st.button("", icon=":material/delete:", key=f"pdel_{p[\'id\']}", help="Remover"):'),

    # Salvar aba
    ('if st.button("💾 Salvar", key=f"asave_{aba[\'id\']}",',
     'if st.button("Salvar", icon=":material/save:", key=f"asave_{aba[\'id\']}",'),

    # Remover aba
    ('if st.button("🗑️ Remover", key=f"adel_{aba[\'id\']}",',
     'if st.button("Remover", icon=":material/delete:", key=f"adel_{aba[\'id\']}",'),

    # Salvar regra fixa
    ('if st.button("💾", key=f"rsave_{r[\'id\']}"):',
     'if st.button("", icon=":material/save:", key=f"rsave_{r[\'id\']}"):'),

    # Remover regra fixa
    ('if st.button("🗑️", key=f"rdel_{r[\'id\']}"):',
     'if st.button("", icon=":material/delete:", key=f"rdel_{r[\'id\']}"):'),

    # Remover categoria custom
    ('if st.button("🗑️", key=f"cdel_{c[\'id\']}"):',
     'if st.button("", icon=":material/delete:", key=f"cdel_{c[\'id\']}"):'),

    # Salvar cartao
    ('if st.button(\n                        "💾 Salvar", key=f"cfg_csave_{_cid}", type="primary",',
     'if st.button(\n                        "Salvar", icon=":material/save:", key=f"cfg_csave_{_cid}", type="primary",'),

    # Popover remover cartao
    ('with st.popover("🗑 Remover", use_container_width=True):',
     'with st.popover("Remover", use_container_width=True):'),

    # Confirmar exclusao cartao
    ('"⚠️ Confirmar exclusão",',
     '"Confirmar exclusão", icon=":material/warning:",'),

    # Adicionar cartao
    ('if st.button("➕ Adicionar Cartão", key="gc_add",',
     'if st.button("Adicionar Cartão", icon=":material/add:", key="gc_add",'),

    # Salvar ciclo
    ('if st.button("💾 Salvar configurações do ciclo", key="btn_salvar_ciclo"):',
     'if st.button("Salvar configurações do ciclo", icon=":material/save:", key="btn_salvar_ciclo"):'),

    # Salvar IA
    ('if st.button("💾  Salvar configuração", key="btn_salvar_ia",',
     'if st.button("Salvar configuração", icon=":material/save:", key="btn_salvar_ia",'),

    # Remover IA
    ('if st.button("🗑  Remover", key="btn_del_ia",',
     'if st.button("Remover", icon=":material/delete:", key="btn_del_ia",'),

    # HTML com emoji de aviso nos cartoes (inline text, nao botao)
    ('f\'<span style="color:#FF6B7A;font-size:11px;">\'\n                            f\'⚠️ Todas as faturas',
     'f\'<span style="color:#FF6B7A;font-size:11px;">\'\n                            f\'Todas as faturas'),

    # Status provedor ativo
    ("'✅ Provedor ativo: <b style=\"color:#E8ECF2;\">{_cfg_atual[\"provedor\"]}</b>'",
     "'Provedor ativo: <b style=\"color:#E8ECF2;\">{_cfg_atual[\"provedor\"]}</b>'"),
])

print("Concluido.")
