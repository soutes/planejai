"""
Agente Relator — gera comentário executivo contextualizado em PT-BR.

Puramente Python: sem chamada extra ao Claude.
Usa o JSON validado + histórico de faturas anteriores do mesmo cartão
para produzir um parágrafo de 2–4 frases com variação, destaque de categoria
e alerta principal.
"""
from __future__ import annotations

_MESES_PT = {
    "01": "Janeiro", "02": "Fevereiro", "03": "Março",
    "04": "Abril",   "05": "Maio",       "06": "Junho",
    "07": "Julho",   "08": "Agosto",     "09": "Setembro",
    "10": "Outubro", "11": "Novembro",   "12": "Dezembro",
}


def _brl(v: float | None) -> str:
    """Formata float para 'R$ 1.234,56'."""
    if v is None:
        return "—"
    formatted = f"{v:,.2f}"
    return "R$ " + formatted.replace(",", "X").replace(".", ",").replace("X", ".")


def _mes_label(mes_ref: str | None) -> str:
    """'2025-03' → 'Março/2025'. Outros formatos passam sem alteração."""
    if not mes_ref:
        return "mês atual"
    parts = str(mes_ref).split("-")
    if len(parts) == 2:
        ano, mes = parts[0], parts[1].zfill(2)
        return f"{_MESES_PT.get(mes, mes)}/{ano}"
    return mes_ref


def generate_commentary(
    analise: dict,
    historico: list[dict] | None = None,
) -> str:
    """
    Gera comentário executivo com base nos dados validados pelo QA.

    Parâmetros:
        analise   — dict já validado e corrigido pelo agent_qa
        historico — lista de dicts `analise_json` de faturas anteriores
                    do mesmo cartão, em qualquer ordem (ordenação interna)

    Retorna:
        string PT-BR pronta para exibir, 2–4 frases.
        Substitui o campo `comentario_executivo` do analista com versão
        enriquecida por contexto histórico.
    """
    fatura   = analise.get("fatura") or {}
    transacs = analise.get("transacoes") or []
    resumo   = analise.get("resumo_categorias") or []
    alertas  = analise.get("alertas") or []

    total_atual = fatura.get("total") or 0
    mes_ref     = fatura.get("mes_referencia")
    banco       = fatura.get("banco") or "cartão"
    limite      = fatura.get("limite")

    partes: list[str] = []

    # ── Frase 1: total + utilização ───────────────────────────────────────────
    util_str = ""
    if limite and total_atual and limite > 0:
        pct = total_atual / limite * 100
        util_str = f" ({pct:.0f}% do limite de {_brl(limite)})"
    partes.append(
        f"Fatura de {_mes_label(mes_ref)} do {banco}: {_brl(total_atual)}{util_str}."
    )

    # ── Frase 2: variação vs mês anterior ────────────────────────────────────
    if historico:
        prev_entry = _find_previous(historico, mes_ref)
        if prev_entry:
            prev_total = (prev_entry.get("fatura") or {}).get("total")
            prev_mes   = (prev_entry.get("fatura") or {}).get("mes_referencia")
            if prev_total and prev_total > 0:
                delta     = total_atual - prev_total
                pct_delta = delta / prev_total * 100
                direcao   = "alta" if delta > 0 else "queda"
                partes.append(
                    f"Em relação a {_mes_label(prev_mes)}: "
                    f"{direcao} de {abs(pct_delta):.1f}% ({_brl(abs(delta))})."
                )

    # ── Frase 3: maior categoria ──────────────────────────────────────────────
    if resumo:
        top = resumo[0]
        partes.append(
            f"Maior gasto: {top['categoria']} com {_brl(top['valor'])} "
            f"({top['percentual']:.0f}% do total, {top['qtd_transacoes']} transações)."
        )

    # ── Frase 4: alerta principal (se houver) ────────────────────────────────
    criticos = [a for a in alertas if a.get("tipo") in ("gasto_atipico", "duplicidade")]
    alertas_ordem = criticos or alertas
    if alertas_ordem:
        msg = alertas_ordem[0].get("mensagem") or ""
        if msg:
            partes.append(f"Atenção: {msg}.")

    return " ".join(partes)


# ── helpers ────────────────────────────────────────────────────────────────────

def _find_previous(historico: list[dict], mes_ref_atual: str | None) -> dict | None:
    """Retorna o dict da fatura imediatamente anterior ao mês atual."""
    candidatos = [
        h for h in historico
        if (h.get("fatura") or {}).get("mes_referencia") != mes_ref_atual
        and (h.get("fatura") or {}).get("mes_referencia") is not None
    ]
    if not candidatos:
        return None
    return max(
        candidatos,
        key=lambda h: (h.get("fatura") or {}).get("mes_referencia") or "",
    )
