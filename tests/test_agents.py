import copy

import pytest

from src.agent_qa import QAError, validate_and_fix
from src.agent_reporter import generate_commentary


# ── Fixtures ──────────────────────────────────────────────────────────────────

@pytest.fixture
def analise_base():
    return {
        "fatura": {
            "banco": "Nubank",
            "total": 100.00,
            "mes_referencia": "2025-03",
            "limite": 2000.00,
        },
        "transacoes": [
            {
                "data": "2025-03-01",
                "estabelecimento": "Mercado",
                "valor": 60.00,
                "categoria": "Alimentação",
            },
            {
                "data": "2025-03-05",
                "estabelecimento": "Netflix",
                "valor": 40.00,
                "categoria": "Assinaturas",
            },
        ],
        "resumo_categorias": [],
    }


@pytest.fixture
def analise_validada(analise_base):
    result, _ = validate_and_fix(analise_base)
    return result


# ── agent_qa / validate_and_fix ───────────────────────────────────────────────

def test_qa_schema_critico():
    with pytest.raises(QAError, match="transacoes"):
        validate_and_fix({"fatura": {}, "resumo_categorias": []})


def test_qa_transacoes_vazia():
    with pytest.raises(QAError):
        validate_and_fix({"fatura": {}, "transacoes": [], "resumo_categorias": []})


def test_qa_categoria_autofix(analise_base):
    analise_base["transacoes"][0]["categoria"] = "INVALIDA"
    result, warnings = validate_and_fix(analise_base)
    assert result["transacoes"][0]["categoria"] == "Outros"
    assert any("Outros" in w for w in warnings)


def test_qa_rebuild_resumo(analise_base):
    result, _ = validate_and_fix(analise_base)
    cats = {r["categoria"]: r["valor"] for r in result["resumo_categorias"]}
    assert cats["Alimentação"] == 60.00
    assert cats["Assinaturas"] == 40.00


def test_qa_duplicidade_warning(analise_base):
    analise_base["transacoes"].append(copy.deepcopy(analise_base["transacoes"][0]))
    _, warnings = validate_and_fix(analise_base)
    assert any("duplicad" in w.lower() for w in warnings)


def test_qa_totais_warning(analise_base):
    # total declarado = 80, soma real = 100 → diff 25% > tolerância de 5%
    analise_base["fatura"]["total"] = 80.0
    _, warnings = validate_and_fix(analise_base)
    assert any("difere" in w.lower() for w in warnings)


# ── agent_reporter / generate_commentary ─────────────────────────────────────

def test_reporter_sem_historico(analise_validada):
    comentario = generate_commentary(analise_validada)
    assert "Nubank" in comentario
    assert "R$ 100,00" in comentario


def test_reporter_com_historico_alta(analise_validada):
    historico = [{"fatura": {"total": 80.0, "mes_referencia": "2025-02"}}]
    comentario = generate_commentary(analise_validada, historico)
    assert "alta" in comentario.lower()


def test_reporter_com_historico_queda(analise_validada):
    historico = [{"fatura": {"total": 130.0, "mes_referencia": "2025-02"}}]
    comentario = generate_commentary(analise_validada, historico)
    assert "queda" in comentario.lower()


def test_reporter_maior_categoria(analise_validada):
    comentario = generate_commentary(analise_validada)
    assert "Alimentação" in comentario
