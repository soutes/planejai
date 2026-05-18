"""
Popula o banco com dados mockup realistas para geração de screenshots de apresentação.
Executa standalone — não precisa do Streamlit rodando.
"""
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from src import database, database_gestao as db

# ── Init ─────────────────────────────────────────────────────────────────────
db.init_db()

MESES = ["2026-02", "2026-03", "2026-04", "2026-05"]
MES_ATUAL = "2026-05"

# ── Pessoas ───────────────────────────────────────────────────────────────────
pessoas_existentes = {p["nome"] for p in db.list_pessoas()}
if "Luiz" not in pessoas_existentes:
    db.add_pessoa("Luiz", "#10F5A3")
if "Ana" not in pessoas_existentes:
    db.add_pessoa("Ana", "#6FA9D6")

pessoas = {p["nome"]: p["id"] for p in db.list_pessoas()}

# ── Abas ─────────────────────────────────────────────────────────────────────
abas = {a["nome"]: a["id"] for a in db.list_abas()}
aba_pessoal = abas.get("Pessoal", 1)
aba_familiar = abas.get("Familiar", 2)

# ── Rendimentos ───────────────────────────────────────────────────────────────
RENDIMENTOS = {
    "2026-02": [
        ("Salário", "Renda Fixa", 8200.00),
        ("Freelas Design", "Renda Variável", 950.00),
    ],
    "2026-03": [
        ("Salário", "Renda Fixa", 8200.00),
        ("Consultoria", "Renda Variável", 1800.00),
        ("Dividendos FIIs", "Investimentos", 320.00),
    ],
    "2026-04": [
        ("Salário", "Renda Fixa", 8500.00),
        ("Freelas Design", "Renda Variável", 1200.00),
        ("Dividendos FIIs", "Investimentos", 410.00),
        ("Reembolso médico", "Outros", 280.00),
    ],
    "2026-05": [
        ("Salário", "Renda Fixa", 8500.00),
        ("Consultoria Tech", "Renda Variável", 2400.00),
        ("Dividendos FIIs", "Investimentos", 390.00),
    ],
}

for mes, itens in RENDIMENTOS.items():
    existentes = {r["descricao"] for r in db.list_rendimentos(mes)}
    for desc, cat, valor in itens:
        if desc not in existentes:
            db.add_rendimento(mes_ref=mes, descricao=desc, categoria=cat, valor=valor)

# ── Despesas ──────────────────────────────────────────────────────────────────
DESPESAS_POR_MES = {
    "2026-02": [
        (aba_pessoal, "Supermercado Pão de Açúcar", "Alimentação", 760.50, "2026-02-08"),
        (aba_pessoal, "iFood pedidos", "Alimentação", 290.00, "2026-02-15"),
        (aba_pessoal, "Combustível Shell", "Transporte", 320.00, "2026-02-10"),
        (aba_pessoal, "Plano de saúde Unimed", "Saúde", 480.00, "2026-02-05"),
        (aba_familiar, "Conta de luz CEMIG", "Casa", 210.00, "2026-02-20"),
        (aba_familiar, "Condomínio", "Casa", 900.00, "2026-02-05"),
        (aba_familiar, "Internet Vivo Fibra", "Assinaturas", 130.00, "2026-02-10"),
        (aba_pessoal, "Netflix", "Lazer", 45.90, "2026-02-18"),
        (aba_pessoal, "Academia Smart Fit", "Saúde", 99.90, "2026-02-01"),
    ],
    "2026-03": [
        (aba_pessoal, "Supermercado Pão de Açúcar", "Alimentação", 820.00, "2026-03-09"),
        (aba_pessoal, "iFood pedidos", "Alimentação", 340.00, "2026-03-18"),
        (aba_pessoal, "Combustível Shell", "Transporte", 290.00, "2026-03-12"),
        (aba_pessoal, "Uber viagens", "Transporte", 180.00, "2026-03-22"),
        (aba_pessoal, "Plano de saúde Unimed", "Saúde", 480.00, "2026-03-05"),
        (aba_pessoal, "Farmácia Drogasil", "Saúde", 145.00, "2026-03-14"),
        (aba_familiar, "Conta de luz CEMIG", "Casa", 195.00, "2026-03-20"),
        (aba_familiar, "Condomínio", "Casa", 900.00, "2026-03-05"),
        (aba_familiar, "Internet Vivo Fibra", "Assinaturas", 130.00, "2026-03-10"),
        (aba_pessoal, "Netflix", "Lazer", 45.90, "2026-03-18"),
        (aba_pessoal, "Spotify", "Lazer", 21.90, "2026-03-18"),
        (aba_pessoal, "Academia Smart Fit", "Saúde", 99.90, "2026-03-01"),
        (aba_pessoal, "Curso Udemy Python", "Educação", 29.90, "2026-03-05"),
    ],
    "2026-04": [
        (aba_pessoal, "Supermercado Pão de Açúcar", "Alimentação", 895.00, "2026-04-07"),
        (aba_pessoal, "Restaurante Dom Cuisine", "Alimentação", 220.00, "2026-04-14"),
        (aba_pessoal, "iFood pedidos", "Alimentação", 380.00, "2026-04-20"),
        (aba_pessoal, "Combustível Shell", "Transporte", 310.00, "2026-04-10"),
        (aba_pessoal, "Uber viagens", "Transporte", 210.00, "2026-04-24"),
        (aba_pessoal, "Plano de saúde Unimed", "Saúde", 480.00, "2026-04-05"),
        (aba_pessoal, "Consulta médica particular", "Saúde", 350.00, "2026-04-16"),
        (aba_familiar, "Conta de luz CEMIG", "Casa", 230.00, "2026-04-20"),
        (aba_familiar, "Condomínio", "Casa", 900.00, "2026-04-05"),
        (aba_familiar, "Internet Vivo Fibra", "Assinaturas", 130.00, "2026-04-10"),
        (aba_pessoal, "Netflix", "Lazer", 45.90, "2026-04-18"),
        (aba_pessoal, "Spotify", "Lazer", 21.90, "2026-04-18"),
        (aba_pessoal, "Academia Smart Fit", "Saúde", 99.90, "2026-04-01"),
        (aba_pessoal, "Roupa Zara", "Vestuário", 380.00, "2026-04-12"),
        (aba_pessoal, "Presente aniversário", "Presente", 180.00, "2026-04-23"),
    ],
    "2026-05": [
        (aba_pessoal, "Supermercado Pão de Açúcar", "Alimentação", 940.00, "2026-05-06"),
        (aba_pessoal, "iFood pedidos", "Alimentação", 420.00, "2026-05-12"),
        (aba_pessoal, "Combustível Shell", "Transporte", 345.00, "2026-05-08"),
        (aba_pessoal, "Uber viagens", "Transporte", 190.00, "2026-05-16"),
        (aba_pessoal, "Plano de saúde Unimed", "Saúde", 480.00, "2026-05-05"),
        (aba_pessoal, "Farmácia Drogasil", "Saúde", 98.50, "2026-05-10"),
        (aba_pessoal, "Academia Smart Fit", "Saúde", 99.90, "2026-05-01"),
        (aba_familiar, "Conta de luz CEMIG", "Casa", 248.00, "2026-05-20"),
        (aba_familiar, "Condomínio", "Casa", 900.00, "2026-05-05"),
        (aba_familiar, "Internet Vivo Fibra", "Assinaturas", 130.00, "2026-05-10"),
        (aba_pessoal, "Netflix", "Lazer", 45.90, "2026-05-18"),
        (aba_pessoal, "Spotify", "Lazer", 21.90, "2026-05-18"),
        (aba_pessoal, "Disney+", "Lazer", 38.90, "2026-05-18"),
        (aba_pessoal, "Curso pós-graduação parcela 3/12", "Educação", 680.00, "2026-05-15"),
        (aba_pessoal, "Sneaker Nike Air Max", "Vestuário", 599.00, "2026-05-03"),
    ],
}

for mes, itens in DESPESAS_POR_MES.items():
    existentes = {d["descricao"] for d in db.list_despesas(None, mes)}
    for aba_id, desc, cat, valor, data in itens:
        if desc not in existentes:
            db.add_despesa(
                aba_id=aba_id, mes_ref=mes, descricao=desc,
                categoria=cat, valor=valor, data=data,
            )

# ── Investimentos ─────────────────────────────────────────────────────────────
INVESTIMENTOS = {
    "2026-02": [
        ("Reserva de Emergência", "Nubank CDB",   22000.00, 1000.00),
        ("Renda Fixa",            "XP CDB 120%",  15500.00, 500.00),
        ("Tesouro Direto",        "IPCA+ 2035",   10200.00, 400.00),
        ("Ações",                 "BOVA11 ETF",    6800.00, 300.00),
        ("FIIs",                  "MXRF11 + HGLG",  4200.00, 500.00),
    ],
    "2026-03": [
        ("Reserva de Emergência", "Nubank CDB",   23000.00, 1000.00),
        ("Renda Fixa",            "XP CDB 120%",  16200.00, 500.00),
        ("Tesouro Direto",        "IPCA+ 2035",   10800.00, 400.00),
        ("Ações",                 "BOVA11 ETF",    7200.00, 300.00),
        ("FIIs",                  "MXRF11 + HGLG",  4800.00, 500.00),
        ("Cripto",                "Bitcoin BTC",   1200.00, 200.00),
    ],
    "2026-04": [
        ("Reserva de Emergência", "Nubank CDB",   24000.00, 1000.00),
        ("Renda Fixa",            "XP CDB 120%",  16900.00, 500.00),
        ("Tesouro Direto",        "IPCA+ 2035",   11500.00, 400.00),
        ("Ações",                 "BOVA11 ETF",    7800.00, 500.00),
        ("FIIs",                  "MXRF11 + HGLG",  5400.00, 500.00),
        ("Cripto",                "Bitcoin BTC",   1500.00, 200.00),
    ],
    "2026-05": [
        ("Reserva de Emergência", "Nubank CDB",   25000.00, 1000.00),
        ("Renda Fixa",            "XP CDB 120%",  17800.00, 500.00),
        ("Tesouro Direto",        "IPCA+ 2035",   12200.00, 400.00),
        ("Ações",                 "BOVA11 ETF",    8500.00, 500.00),
        ("FIIs",                  "MXRF11 + HGLG",  6000.00, 500.00),
        ("Cripto",                "Bitcoin BTC",   2100.00, 400.00),
        ("Internacional",         "VOO ETF USD",   3800.00, 600.00),
    ],
}

for mes, itens in INVESTIMENTOS.items():
    for cat, inst, valor, aporte in itens:
        db.upsert_investimento(mes_ref=mes, categoria=cat, instituicao=inst,
                               valor=valor, aporte_mes=aporte)

# ── Cartão de crédito (database.py — módulo analista de faturas) ──────────────
database.init_db()
cartoes_existentes = {c["nome"] for c in database.list_cartoes()}
if "Nubank Roxinho" not in cartoes_existentes:
    database.add_cartao(nome="Nubank Roxinho", proprietario="Luiz",
                        final_digitos="4512", cor="#8A05BE", limite=12000.00)
if "C6 Bank" not in cartoes_existentes:
    database.add_cartao(nome="C6 Bank", proprietario="Luiz",
                        final_digitos="7731", cor="#242424", limite=8000.00)
if "Itaú Personnalité" not in cartoes_existentes:
    database.add_cartao(nome="Itaú Personnalité", proprietario="Ana",
                        final_digitos="9903", cor="#FF6B00", limite=15000.00)

print("OK - Dados mockup inseridos com sucesso!")
print(f"   Rendimentos:  {sum(len(v) for v in RENDIMENTOS.values())} lançamentos")
print(f"   Despesas:     {sum(len(v) for v in DESPESAS_POR_MES.values())} lançamentos")
print(f"   Investimentos:{sum(len(v) for v in INVESTIMENTOS.values())} snapshots")
print(f"   Cartões:      3 cadastrados")
