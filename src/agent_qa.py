"""
Agente QA — valida e auto-corrige o JSON retornado pelo Analista de Faturas.

Sem chamada ao Claude: validação é determinística e instantânea.
Falhas críticas levantam QAError; problemas suaves são auto-corrigidos e
registrados em warnings.
"""
from __future__ import annotations

import re
from collections import defaultdict

VALID_CATEGORIAS = {
    "Alimentação", "Transporte", "Saúde", "Educação", "Lazer",
    "Casa", "Vestuário", "Assinaturas", "Pets", "Viagem",
    "Presente", "Cartão", "Outros",
}

REQUIRED_TOP_FIELDS = ("fatura", "transacoes", "resumo_categorias")
TOTAL_TOLERANCE = 0.05   # 5% de diferença aceitável entre total fatura e soma transações
DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")


class QAError(ValueError):
    """Falha crítica — análise não pode ser salva."""
    pass


def validate_and_fix(analise: dict) -> tuple[dict, list[str]]:
    """
    Valida e auto-corrige o JSON do analista.

    Retorna (analise_corrigida, warnings).
    Lança QAError em falhas que tornam o resultado inutilizável.

    Checks:
      1. Schema — campos obrigatórios presentes
      2. Transações não-vazias
      3. Conferência de totais  (soft — avisa, não rejeita)
      4. Categorias             (auto-fix: inválida → 'Outros')
      5. Formato de datas       (soft — avisa)
      6. Duplicidades           (soft — avisa)
      7. Rebuild de resumo_categorias com dados já corrigidos
    """
    warnings: list[str] = []

    # ── 1. Schema ──────────────────────────────────────────────────────────────
    missing = [f for f in REQUIRED_TOP_FIELDS if f not in analise]
    if missing:
        raise QAError(f"Campos obrigatórios ausentes no JSON: {missing}")

    transacoes: list[dict] = analise.get("transacoes") or []
    fatura: dict = analise.get("fatura") or {}

    # ── 2. Transações não-vazias ───────────────────────────────────────────────
    if not transacoes:
        raise QAError("Campo 'transacoes' está vazio — análise sem transações é inválida.")

    # ── 3. Conferência de totais ──────────────────────────────────────────────
    fatura_total = fatura.get("total")
    if fatura_total and fatura_total > 0:
        soma_debitos = sum(
            (t.get("valor") or 0) for t in transacoes
            if (t.get("valor") or 0) > 0
        )
        diff_pct = abs(soma_debitos - fatura_total) / fatura_total
        if diff_pct > TOTAL_TOLERANCE:
            warnings.append(
                f"Total da fatura (R$ {fatura_total:.2f}) difere da soma de débitos "
                f"(R$ {soma_debitos:.2f}) em {diff_pct * 100:.1f}%. "
                "Verifique créditos/estornos incluídos."
            )

    # ── 4. Categorias — auto-corrige inválidas ────────────────────────────────
    fixed_cats = 0
    for t in transacoes:
        if t.get("categoria") not in VALID_CATEGORIAS:
            t["categoria"] = "Outros"
            fixed_cats += 1
    if fixed_cats:
        warnings.append(
            f"{fixed_cats} transacao(oes) com categoria desconhecida -> corrigida(s) para 'Outros'."
        )

    # ── 5. Formato de datas ───────────────────────────────────────────────────
    bad_dates = [
        t.get("data") for t in transacoes
        if t.get("data") and not DATE_RE.match(str(t["data"]))
    ]
    if bad_dates:
        warnings.append(
            f"{len(bad_dates)} data(s) fora do formato YYYY-MM-DD: {bad_dates[:3]}"
            + ("..." if len(bad_dates) > 3 else "")
        )

    # ── 6. Duplicidades ───────────────────────────────────────────────────────
    seen: dict = {}
    dupes = 0
    for t in transacoes:
        key = (t.get("data"), t.get("estabelecimento"), t.get("valor"))
        if all(v is not None for v in key):
            if key in seen:
                dupes += 1
            seen[key] = True
    if dupes:
        warnings.append(
            f"{dupes} possível(is) transação(ões) duplicada(s) detectada(s) "
            "(mesmo estabelecimento + data + valor)."
        )

    # ── 7. Rebuild resumo_categorias com dados já corrigidos ─────────────────
    totals: dict[str, float] = defaultdict(float)
    counts: dict[str, int] = defaultdict(int)
    for t in transacoes:
        v = t.get("valor") or 0
        c = t.get("categoria") or "Outros"
        if v > 0:
            totals[c] += v
            counts[c] += 1
    total_pos = sum(totals.values()) or 1
    analise["resumo_categorias"] = [
        {
            "categoria": cat,
            "valor": round(v, 2),
            "percentual": round(v / total_pos * 100, 1),
            "qtd_transacoes": counts[cat],
        }
        for cat, v in sorted(totals.items(), key=lambda x: -x[1])
    ]

    return analise, warnings
