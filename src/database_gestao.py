"""gestao.db — banco principal do planejAÍ."""

import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).resolve().parent.parent / "data" / "gestao.db"

SCHEMA = """
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS pessoas (
    id    INTEGER PRIMARY KEY AUTOINCREMENT,
    nome  TEXT    NOT NULL,
    cor   TEXT    NOT NULL DEFAULT '#B07AFF',
    ativo INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS abas_despesas (
    id                      INTEGER PRIMARY KEY AUTOINCREMENT,
    nome                    TEXT    NOT NULL,
    icon                    TEXT    NOT NULL DEFAULT '💸',
    cor                     TEXT    NOT NULL DEFAULT '#10F5A3',
    ordem                   INTEGER NOT NULL DEFAULT 0,
    split_destino_categoria TEXT,
    ativo                   INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS aba_pessoas (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    aba_id        INTEGER NOT NULL REFERENCES abas_despesas(id) ON DELETE CASCADE,
    pessoa_id     INTEGER NOT NULL REFERENCES pessoas(id)       ON DELETE CASCADE,
    ratio_default REAL    NOT NULL DEFAULT 0.5,
    UNIQUE(aba_id, pessoa_id)
);

CREATE TABLE IF NOT EXISTS categorias_despesa (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    nome       TEXT    NOT NULL UNIQUE,
    icon       TEXT    NOT NULL DEFAULT '📌',
    padrao     INTEGER NOT NULL DEFAULT 0,
    permanente INTEGER NOT NULL DEFAULT 1,
    ativa      INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS regras_fixas (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    aba_id         INTEGER NOT NULL REFERENCES abas_despesas(id) ON DELETE CASCADE,
    descricao      TEXT    NOT NULL,
    categoria      TEXT    NOT NULL,
    valor          REAL    NOT NULL,
    dia_vencimento INTEGER,
    ativo          INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS despesas (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    aba_id           INTEGER NOT NULL REFERENCES abas_despesas(id) ON DELETE CASCADE,
    mes_ref          TEXT    NOT NULL,
    data             TEXT,
    descricao        TEXT    NOT NULL,
    categoria        TEXT    NOT NULL,
    valor            REAL    NOT NULL,
    notas            TEXT,
    tipo             TEXT    NOT NULL DEFAULT 'manual',
    recorrente       INTEGER NOT NULL DEFAULT 0,
    total_repeticoes INTEGER,
    origem_id        INTEGER,
    parcela_num      INTEGER,
    total_parcelas   INTEGER,
    em_fatura_cartao INTEGER NOT NULL DEFAULT 0,
    cartao_id        INTEGER,
    somente_meu      INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS despesa_splits (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    despesa_id      INTEGER NOT NULL REFERENCES despesas(id) ON DELETE CASCADE,
    pessoa_id       INTEGER NOT NULL REFERENCES pessoas(id)  ON DELETE CASCADE,
    ratio           REAL    NOT NULL,
    valor_calculado REAL    NOT NULL
);

CREATE TABLE IF NOT EXISTS divisao_entries (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    pessoa_id         INTEGER NOT NULL REFERENCES pessoas(id) ON DELETE CASCADE,
    mes_ref           TEXT    NOT NULL,
    descricao         TEXT    NOT NULL,
    valor_total       REAL    NOT NULL,
    direcao           TEXT    NOT NULL DEFAULT 'a_receber',
    parcelado         INTEGER NOT NULL DEFAULT 0,
    total_parcelas    INTEGER,
    parcela_atual     INTEGER          DEFAULT 1,
    data_inicio       TEXT,
    origem_despesa_id INTEGER,
    quitado           INTEGER NOT NULL DEFAULT 0,
    notas             TEXT
);

CREATE TABLE IF NOT EXISTS orcamentos (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    aba_id     INTEGER NOT NULL REFERENCES abas_despesas(id) ON DELETE CASCADE,
    mes_ref    TEXT,
    categoria  TEXT    NOT NULL,
    valor_meta REAL    NOT NULL,
    UNIQUE(aba_id, mes_ref, categoria)
);

CREATE TABLE IF NOT EXISTS rendimentos (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    mes_ref          TEXT NOT NULL,
    descricao        TEXT NOT NULL,
    categoria        TEXT NOT NULL DEFAULT 'Salário',
    valor            REAL NOT NULL,
    recorrente       INTEGER NOT NULL DEFAULT 0,
    total_repeticoes INTEGER,
    origem_id        INTEGER
);

CREATE TABLE IF NOT EXISTS investimentos_snapshots (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    mes_ref     TEXT NOT NULL,
    categoria   TEXT NOT NULL,
    instituicao TEXT NOT NULL DEFAULT '',
    valor       REAL NOT NULL,
    aporte_mes  REAL NOT NULL DEFAULT 0,
    notas       TEXT,
    UNIQUE(mes_ref, categoria, instituicao)
);

CREATE TABLE IF NOT EXISTS cartoes_splits (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    cartao_id  INTEGER NOT NULL,
    pessoa_id  INTEGER NOT NULL REFERENCES pessoas(id) ON DELETE CASCADE,
    ratio      REAL    NOT NULL,
    UNIQUE(cartao_id, pessoa_id)
);

CREATE INDEX IF NOT EXISTS idx_despesas_aba_mes  ON despesas(aba_id, mes_ref);
CREATE INDEX IF NOT EXISTS idx_despesas_cartao   ON despesas(cartao_id, mes_ref);
CREATE INDEX IF NOT EXISTS idx_rendimentos_mes   ON rendimentos(mes_ref);
CREATE INDEX IF NOT EXISTS idx_invest_mes        ON investimentos_snapshots(mes_ref);
CREATE INDEX IF NOT EXISTS idx_divisao_pessoa    ON divisao_entries(pessoa_id, quitado);
CREATE INDEX IF NOT EXISTS idx_cartoes_splits    ON cartoes_splits(cartao_id);
"""

_CATEGORIAS_PADRAO = [
    ("Alimentação",  "🍽️"),
    ("Transporte",   "🚗"),
    ("Saúde",        "🏥"),
    ("Educação",     "📚"),
    ("Lazer",        "🎬"),
    ("Casa",         "🏠"),
    ("Vestuário",    "👕"),
    ("Assinaturas",  "📱"),
    ("Pets",         "🐾"),
    ("Viagem",       "✈️"),
    ("Presente",     "🎁"),
    ("Cartão",       "💳"),
    ("Outros",       "📌"),
]

_ABAS_PADRAO = [
    ("Pessoal",  "👤", "#10F5A3", 0, None),
    ("Familiar", "🏠", "#6FA9D6", 1, "Casa"),
]


def _connect() -> sqlite3.Connection:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.execute("PRAGMA foreign_keys = ON")
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    with _connect() as conn:
        conn.executescript(SCHEMA)
        for nome, icon in _CATEGORIAS_PADRAO:
            conn.execute(
                """INSERT INTO categorias_despesa (nome, icon, padrao, permanente) VALUES (?, ?, 1, 1)
                   ON CONFLICT(nome) DO UPDATE SET padrao=1, permanente=1""",
                (nome, icon),
            )
        for nome, icon, cor, ordem, split_dest in _ABAS_PADRAO:
            conn.execute(
                """INSERT OR IGNORE INTO abas_despesas (nome, icon, cor, ordem, split_destino_categoria)
                   SELECT ?, ?, ?, ?, ? WHERE NOT EXISTS
                   (SELECT 1 FROM abas_despesas WHERE nome = ? AND ativo = 1)""",
                (nome, icon, cor, ordem, split_dest, nome),
            )
        conn.commit()


# ═══════════════════════════════════════════════════════════════════════════════
# PESSOAS
# ═══════════════════════════════════════════════════════════════════════════════

def list_pessoas(apenas_ativas: bool = True) -> list[dict]:
    with _connect() as conn:
        q = "SELECT * FROM pessoas"
        if apenas_ativas:
            q += " WHERE ativo = 1"
        return [dict(r) for r in conn.execute(q + " ORDER BY nome").fetchall()]


def add_pessoa(nome: str, cor: str = "#B07AFF") -> int:
    with _connect() as conn:
        cur = conn.execute("INSERT INTO pessoas (nome, cor) VALUES (?, ?)", (nome.strip(), cor))
        conn.commit()
        return cur.lastrowid


def update_pessoa(pessoa_id: int, nome: str, cor: str) -> None:
    with _connect() as conn:
        conn.execute("UPDATE pessoas SET nome=?, cor=? WHERE id=?", (nome.strip(), cor, pessoa_id))
        conn.commit()


def deactivate_pessoa(pessoa_id: int) -> None:
    with _connect() as conn:
        conn.execute("UPDATE pessoas SET ativo=0 WHERE id=?", (pessoa_id,))
        conn.commit()


# ═══════════════════════════════════════════════════════════════════════════════
# ABAS DE DESPESA
# ═══════════════════════════════════════════════════════════════════════════════

def list_abas(apenas_ativas: bool = True) -> list[dict]:
    with _connect() as conn:
        q = "SELECT * FROM abas_despesas"
        if apenas_ativas:
            q += " WHERE ativo = 1"
        abas = [dict(r) for r in conn.execute(q + " ORDER BY ordem, id").fetchall()]
        for aba in abas:
            aba["pessoas"] = _aba_pessoas(conn, aba["id"])
        return abas


def _aba_pessoas(conn: sqlite3.Connection, aba_id: int) -> list[dict]:
    rows = conn.execute(
        """SELECT ap.id, ap.pessoa_id, ap.ratio_default, p.nome, p.cor
           FROM aba_pessoas ap JOIN pessoas p ON p.id = ap.pessoa_id
           WHERE ap.aba_id = ? AND p.ativo = 1 ORDER BY p.nome""",
        (aba_id,),
    ).fetchall()
    return [dict(r) for r in rows]


def add_aba(nome: str, icon: str = "💸", cor: str = "#10F5A3",
            split_destino_categoria: str | None = None) -> int:
    with _connect() as conn:
        max_ordem = conn.execute("SELECT COALESCE(MAX(ordem), -1) FROM abas_despesas").fetchone()[0]
        cur = conn.execute(
            "INSERT INTO abas_despesas (nome, icon, cor, ordem, split_destino_categoria) VALUES (?, ?, ?, ?, ?)",
            (nome.strip(), icon, cor, max_ordem + 1, split_destino_categoria),
        )
        conn.commit()
        return cur.lastrowid


def update_aba(aba_id: int, nome: str, icon: str, cor: str,
               split_destino_categoria: str | None) -> None:
    with _connect() as conn:
        conn.execute(
            "UPDATE abas_despesas SET nome=?, icon=?, cor=?, split_destino_categoria=? WHERE id=?",
            (nome.strip(), icon, cor, split_destino_categoria, aba_id),
        )
        conn.commit()


def deactivate_aba(aba_id: int) -> None:
    with _connect() as conn:
        conn.execute("UPDATE abas_despesas SET ativo=0 WHERE id=?", (aba_id,))
        conn.commit()


def set_aba_pessoas(aba_id: int, pessoas: list[dict]) -> None:
    with _connect() as conn:
        conn.execute("DELETE FROM aba_pessoas WHERE aba_id=?", (aba_id,))
        for p in pessoas:
            conn.execute(
                "INSERT OR REPLACE INTO aba_pessoas (aba_id, pessoa_id, ratio_default) VALUES (?, ?, ?)",
                (aba_id, p["pessoa_id"], p["ratio_default"]),
            )
        conn.commit()


# ═══════════════════════════════════════════════════════════════════════════════
# CATEGORIAS
# ═══════════════════════════════════════════════════════════════════════════════

def list_categorias(apenas_ativas: bool = True) -> list[dict]:
    with _connect() as conn:
        q = "SELECT * FROM categorias_despesa"
        if apenas_ativas:
            q += " WHERE ativa = 1"
        return [dict(r) for r in conn.execute(q + " ORDER BY padrao DESC, nome").fetchall()]


def nomes_categorias() -> list[str]:
    return [c["nome"] for c in list_categorias()]


def add_categoria(nome: str, icon: str = "📌", permanente: bool = True) -> int:
    with _connect() as conn:
        cur = conn.execute(
            "INSERT INTO categorias_despesa (nome, icon, padrao, permanente) VALUES (?, ?, 0, ?)",
            (nome.strip(), icon, int(permanente)),
        )
        conn.commit()
        return cur.lastrowid


def deactivate_categoria(cat_id: int) -> None:
    with _connect() as conn:
        conn.execute("UPDATE categorias_despesa SET ativa=0 WHERE id=? AND padrao=0", (cat_id,))
        conn.commit()


# ═══════════════════════════════════════════════════════════════════════════════
# REGRAS FIXAS
# ═══════════════════════════════════════════════════════════════════════════════

def list_regras_fixas(aba_id: int | None = None, apenas_ativas: bool = True) -> list[dict]:
    with _connect() as conn:
        q = """SELECT rf.*, a.nome as aba_nome, a.cor as aba_cor, a.icon as aba_icon
               FROM regras_fixas rf JOIN abas_despesas a ON a.id = rf.aba_id WHERE 1=1"""
        params: list = []
        if apenas_ativas:
            q += " AND rf.ativo = 1"
        if aba_id is not None:
            q += " AND rf.aba_id = ?"
            params.append(aba_id)
        q += " ORDER BY a.ordem, rf.dia_vencimento NULLS LAST, rf.descricao"
        return [dict(r) for r in conn.execute(q, params).fetchall()]


def add_regra_fixa(aba_id: int, descricao: str, categoria: str,
                   valor: float, dia_vencimento: int | None = None) -> int:
    with _connect() as conn:
        cur = conn.execute(
            "INSERT INTO regras_fixas (aba_id, descricao, categoria, valor, dia_vencimento) VALUES (?, ?, ?, ?, ?)",
            (aba_id, descricao.strip(), categoria, valor, dia_vencimento),
        )
        conn.commit()
        return cur.lastrowid


def update_regra_fixa(regra_id: int, descricao: str, categoria: str,
                      valor: float, dia_vencimento: int | None) -> None:
    with _connect() as conn:
        conn.execute(
            "UPDATE regras_fixas SET descricao=?, categoria=?, valor=?, dia_vencimento=? WHERE id=?",
            (descricao.strip(), categoria, valor, dia_vencimento, regra_id),
        )
        conn.commit()


def deactivate_regra_fixa(regra_id: int) -> None:
    with _connect() as conn:
        conn.execute("UPDATE regras_fixas SET ativo=0 WHERE id=?", (regra_id,))
        conn.commit()


# ═══════════════════════════════════════════════════════════════════════════════
# DESPESAS
# ═══════════════════════════════════════════════════════════════════════════════

def list_despesas(aba_id: int | None, mes_ref: str,
                  tipo: str | None = None) -> list[dict]:
    with _connect() as conn:
        q = "SELECT * FROM despesas WHERE mes_ref = ?"
        params: list = [mes_ref]
        if aba_id is not None:
            q += " AND aba_id = ?"
            params.append(aba_id)
        if tipo:
            q += " AND tipo = ?"
            params.append(tipo)
        q += " ORDER BY data NULLS LAST, id"
        return [dict(r) for r in conn.execute(q, params).fetchall()]


def add_despesa(aba_id: int, mes_ref: str, descricao: str,
                categoria: str, valor: float,
                data: str | None = None, notas: str | None = None,
                tipo: str = "manual",
                recorrente: bool = False, total_repeticoes: int | None = None,
                origem_id: int | None = None,
                parcela_num: int | None = None, total_parcelas: int | None = None,
                em_fatura_cartao: bool = False, cartao_id: int | None = None,
                somente_meu: bool = False) -> int:
    if not descricao or not descricao.strip():
        raise ValueError("Descrição não pode estar vazia")
    if valor <= 0:
        raise ValueError("Valor deve ser positivo")
    with _connect() as conn:
        cur = conn.execute(
            """INSERT INTO despesas
               (aba_id, mes_ref, data, descricao, categoria, valor, notas, tipo,
                recorrente, total_repeticoes, origem_id, parcela_num, total_parcelas,
                em_fatura_cartao, cartao_id, somente_meu)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (aba_id, mes_ref, data, descricao.strip(), categoria, valor, notas, tipo,
             int(recorrente), total_repeticoes, origem_id, parcela_num, total_parcelas,
             int(em_fatura_cartao), cartao_id, int(somente_meu)),
        )
        new_id = cur.lastrowid
        if recorrente:
            _propagar_despesa(conn, new_id, aba_id, mes_ref, data, descricao,
                              categoria, valor, notas, tipo, total_repeticoes,
                              parcela_num, total_parcelas, em_fatura_cartao,
                              cartao_id, somente_meu)
        conn.commit()
        return new_id


def _propagar_despesa(conn, origem_id, aba_id, mes_ref_inicio, data_base,
                       descricao, categoria, valor, notas, tipo,
                       total_repeticoes, parcela_num, total_parcelas,
                       em_fatura_cartao, cartao_id, somente_meu) -> None:
    y, m = int(mes_ref_inicio[:4]), int(mes_ref_inicio[5:7])
    n = total_repeticoes if total_repeticoes else 24
    for i in range(1, n):
        m += 1
        if m > 12:
            m, y = 1, y + 1
        mr = f"{y:04d}-{m:02d}"
        pn = (parcela_num + i) if parcela_num else None
        if total_parcelas and pn and pn > total_parcelas:
            break
        conn.execute(
            """INSERT OR IGNORE INTO despesas
               (aba_id, mes_ref, data, descricao, categoria, valor, notas, tipo,
                recorrente, total_repeticoes, origem_id, parcela_num, total_parcelas,
                em_fatura_cartao, cartao_id, somente_meu)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?)""",
            (aba_id, mr, data_base, descricao, categoria, valor, notas, tipo,
             total_repeticoes, origem_id, pn, total_parcelas,
             int(em_fatura_cartao), cartao_id, int(somente_meu)),
        )


def update_despesa(despesa_id: int, descricao: str, categoria: str,
                   valor: float, data: str | None, notas: str | None) -> None:
    with _connect() as conn:
        conn.execute(
            "UPDATE despesas SET descricao=?, categoria=?, valor=?, data=?, notas=? WHERE id=?",
            (descricao.strip(), categoria, valor, data, notas, despesa_id),
        )
        conn.commit()


def delete_despesa(despesa_id: int, apagar_serie: bool = False) -> None:
    with _connect() as conn:
        if apagar_serie:
            row = conn.execute("SELECT origem_id FROM despesas WHERE id=?", (despesa_id,)).fetchone()
            origem = (row["origem_id"] or despesa_id) if row else despesa_id
            conn.execute("DELETE FROM despesas WHERE id=? OR origem_id=?", (origem, origem))
        else:
            conn.execute("DELETE FROM despesas WHERE id=?", (despesa_id,))
        conn.commit()


def add_despesa_split(despesa_id: int, pessoa_id: int,
                      ratio: float, valor_calculado: float) -> None:
    with _connect() as conn:
        conn.execute(
            "INSERT INTO despesa_splits (despesa_id, pessoa_id, ratio, valor_calculado) VALUES (?, ?, ?, ?)",
            (despesa_id, pessoa_id, ratio, valor_calculado),
        )
        conn.commit()


def get_despesa_splits(despesa_id: int) -> list[dict]:
    with _connect() as conn:
        rows = conn.execute(
            """SELECT ds.*, p.nome, p.cor FROM despesa_splits ds
               JOIN pessoas p ON p.id = ds.pessoa_id
               WHERE ds.despesa_id = ?""",
            (despesa_id,),
        ).fetchall()
        return [dict(r) for r in rows]


def total_despesas_aba_mes(aba_id: int, mes_ref: str,
                            incluir_fixas: bool = True,
                            incluir_cartao: bool = True) -> float:
    with _connect() as conn:
        tipos_excluir = []
        if not incluir_fixas:
            tipos_excluir.append("'fixa'")
        if not incluir_cartao:
            tipos_excluir.append("'cartao'")
        q = "SELECT COALESCE(SUM(valor), 0) FROM despesas WHERE aba_id=? AND mes_ref=?"
        params: list = [aba_id, mes_ref]
        if tipos_excluir:
            q += f" AND tipo NOT IN ({','.join(tipos_excluir)})"
        row = conn.execute(q, params).fetchone()
        return float(row[0])


def despesas_por_categoria_mes(aba_id: int | None, mes_ref: str) -> dict[str, float]:
    with _connect() as conn:
        q = "SELECT categoria, SUM(valor) as total FROM despesas WHERE mes_ref=?"
        params: list = [mes_ref]
        if aba_id is not None:
            q += " AND aba_id=?"
            params.append(aba_id)
        q += " GROUP BY categoria ORDER BY total DESC"
        rows = conn.execute(q, params).fetchall()
        return {r["categoria"]: float(r["total"]) for r in rows}


def total_despesas_mes(mes_ref: str) -> float:
    """Total de todas as abas no mês."""
    with _connect() as conn:
        row = conn.execute(
            "SELECT COALESCE(SUM(valor), 0) FROM despesas WHERE mes_ref=?", (mes_ref,)
        ).fetchone()
        return float(row[0])


# ═══════════════════════════════════════════════════════════════════════════════
# DIVISÃO DE GASTOS (ex-Splitwise)
# ═══════════════════════════════════════════════════════════════════════════════

def list_divisao_entries(mes_ref: str | None = None,
                          pessoa_id: int | None = None,
                          quitado: bool | None = False) -> list[dict]:
    with _connect() as conn:
        q = """SELECT de.*, p.nome as pessoa_nome, p.cor as pessoa_cor
               FROM divisao_entries de
               JOIN pessoas p ON p.id = de.pessoa_id
               WHERE 1=1"""
        params: list = []
        if mes_ref:
            q += " AND de.mes_ref = ?"
            params.append(mes_ref)
        if pessoa_id is not None:
            q += " AND de.pessoa_id = ?"
            params.append(pessoa_id)
        if quitado is not None:
            q += " AND de.quitado = ?"
            params.append(int(quitado))
        q += " ORDER BY de.mes_ref DESC, de.id"
        return [dict(r) for r in conn.execute(q, params).fetchall()]


def add_divisao_entry(pessoa_id: int, mes_ref: str, descricao: str,
                       valor_total: float, direcao: str = "a_receber",
                       parcelado: bool = False, total_parcelas: int | None = None,
                       parcela_atual: int = 1, data_inicio: str | None = None,
                       origem_despesa_id: int | None = None,
                       notas: str | None = None) -> int:
    with _connect() as conn:
        cur = conn.execute(
            """INSERT INTO divisao_entries
               (pessoa_id, mes_ref, descricao, valor_total, direcao,
                parcelado, total_parcelas, parcela_atual, data_inicio,
                origem_despesa_id, notas)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (pessoa_id, mes_ref, descricao.strip(), valor_total, direcao,
             int(parcelado), total_parcelas, parcela_atual, data_inicio,
             origem_despesa_id, notas),
        )
        conn.commit()
        return cur.lastrowid


def quitar_divisao(entry_id: int) -> None:
    with _connect() as conn:
        conn.execute("UPDATE divisao_entries SET quitado=1 WHERE id=?", (entry_id,))
        conn.commit()


def delete_divisao(entry_id: int) -> None:
    with _connect() as conn:
        conn.execute("DELETE FROM divisao_entries WHERE id=?", (entry_id,))
        conn.commit()


def saldo_divisao_por_pessoa(mes_ref: str | None = None) -> list[dict]:
    """Retorna saldo líquido por pessoa (a_receber - a_pagar)."""
    with _connect() as conn:
        q = """SELECT p.id, p.nome, p.cor,
               SUM(CASE WHEN de.direcao = 'a_receber' AND de.quitado = 0 THEN de.valor_total ELSE 0 END) as total_receber,
               SUM(CASE WHEN de.direcao = 'a_pagar'   AND de.quitado = 0 THEN de.valor_total ELSE 0 END) as total_pagar
               FROM pessoas p
               LEFT JOIN divisao_entries de ON de.pessoa_id = p.id"""
        params: list = []
        if mes_ref:
            q += " AND de.mes_ref = ?"
            params.append(mes_ref)
        q += " WHERE p.ativo = 1 GROUP BY p.id ORDER BY p.nome"
        rows = conn.execute(q, params).fetchall()
        result = []
        for r in rows:
            d = dict(r)
            d["saldo_liquido"] = round(d["total_receber"] - d["total_pagar"], 2)
            result.append(d)
        return result


# ═══════════════════════════════════════════════════════════════════════════════
# ORÇAMENTOS / METAS
# ═══════════════════════════════════════════════════════════════════════════════

def list_orcamentos(aba_id: int, mes_ref: str | None = None) -> list[dict]:
    """Retorna metas para o mês (específico) ou metas padrão (mes_ref=None)."""
    with _connect() as conn:
        rows = conn.execute(
            "SELECT * FROM orcamentos WHERE aba_id=? AND (mes_ref=? OR mes_ref IS NULL) ORDER BY categoria",
            (aba_id, mes_ref),
        ).fetchall()
        return [dict(r) for r in rows]


def upsert_orcamento(aba_id: int, categoria: str, valor_meta: float,
                      mes_ref: str | None = None) -> None:
    with _connect() as conn:
        conn.execute(
            """INSERT INTO orcamentos (aba_id, mes_ref, categoria, valor_meta)
               VALUES (?, ?, ?, ?)
               ON CONFLICT(aba_id, mes_ref, categoria)
               DO UPDATE SET valor_meta=excluded.valor_meta""",
            (aba_id, mes_ref, categoria, valor_meta),
        )
        conn.commit()


def delete_orcamento(orc_id: int) -> None:
    with _connect() as conn:
        conn.execute("DELETE FROM orcamentos WHERE id=?", (orc_id,))
        conn.commit()


# ═══════════════════════════════════════════════════════════════════════════════
# RENDIMENTOS
# ═══════════════════════════════════════════════════════════════════════════════

CATEGORIAS_RENDIMENTO = ["Salário", "Aluguel", "Freelas", "Dividendos", "Outros"]


def list_rendimentos(mes_ref: str) -> list[dict]:
    with _connect() as conn:
        rows = conn.execute(
            "SELECT * FROM rendimentos WHERE mes_ref=? ORDER BY categoria, descricao", (mes_ref,)
        ).fetchall()
        return [dict(r) for r in rows]


def total_rendimentos(mes_ref: str) -> float:
    with _connect() as conn:
        row = conn.execute("SELECT COALESCE(SUM(valor),0) FROM rendimentos WHERE mes_ref=?", (mes_ref,)).fetchone()
        return float(row[0])


def add_rendimento(mes_ref: str, descricao: str, categoria: str,
                   valor: float, recorrente: bool = False,
                   total_repeticoes: int | None = None) -> int:
    with _connect() as conn:
        cur = conn.execute(
            """INSERT INTO rendimentos (mes_ref, descricao, categoria, valor, recorrente, total_repeticoes)
               VALUES (?, ?, ?, ?, ?, ?)""",
            (mes_ref, descricao.strip(), categoria, valor, int(recorrente), total_repeticoes),
        )
        new_id = cur.lastrowid
        if recorrente:
            _propagar_rendimento(conn, new_id, mes_ref, descricao, categoria, valor, total_repeticoes)
        conn.commit()
        return new_id


def _propagar_rendimento(conn, origem_id, mes_ref_inicio, descricao,
                          categoria, valor, total_repeticoes) -> None:
    y, m = int(mes_ref_inicio[:4]), int(mes_ref_inicio[5:7])
    n = total_repeticoes if total_repeticoes else 24
    for _ in range(1, n):
        m += 1
        if m > 12:
            m, y = 1, y + 1
        conn.execute(
            """INSERT OR IGNORE INTO rendimentos
               (mes_ref, descricao, categoria, valor, recorrente, total_repeticoes, origem_id)
               VALUES (?, ?, ?, ?, 1, ?, ?)""",
            (f"{y:04d}-{m:02d}", descricao, categoria, valor, total_repeticoes, origem_id),
        )


def update_rendimento(rendimento_id: int, descricao: str,
                       categoria: str, valor: float) -> None:
    with _connect() as conn:
        conn.execute(
            "UPDATE rendimentos SET descricao=?, categoria=?, valor=? WHERE id=?",
            (descricao.strip(), categoria, valor, rendimento_id),
        )
        conn.commit()


def delete_rendimento(rendimento_id: int, apagar_serie: bool = False) -> None:
    with _connect() as conn:
        if apagar_serie:
            row = conn.execute("SELECT origem_id FROM rendimentos WHERE id=?", (rendimento_id,)).fetchone()
            origem = (row["origem_id"] or rendimento_id) if row else rendimento_id
            conn.execute("DELETE FROM rendimentos WHERE id=? OR origem_id=?", (origem, origem))
        else:
            conn.execute("DELETE FROM rendimentos WHERE id=?", (rendimento_id,))
        conn.commit()


def historico_rendimentos(meses: int = 12) -> list[dict]:
    with _connect() as conn:
        rows = conn.execute(
            """SELECT mes_ref, SUM(valor) as total FROM rendimentos
               WHERE mes_ref <= strftime('%Y-%m', 'now')
               GROUP BY mes_ref ORDER BY mes_ref DESC LIMIT ?""",
            (meses,),
        ).fetchall()
        return [dict(r) for r in reversed(rows)]


def rendimentos_por_categoria(mes_ref: str) -> dict[str, float]:
    with _connect() as conn:
        rows = conn.execute(
            "SELECT categoria, SUM(valor) as total FROM rendimentos WHERE mes_ref=? GROUP BY categoria",
            (mes_ref,),
        ).fetchall()
        return {r["categoria"]: float(r["total"]) for r in rows}


# ═══════════════════════════════════════════════════════════════════════════════
# INVESTIMENTOS
# ═══════════════════════════════════════════════════════════════════════════════

CATEGORIAS_INVESTIMENTO = [
    "Reserva de Emergência", "Renda Fixa", "Tesouro Direto",
    "Ações", "FIIs", "Previdência Privada", "Fundos", "Cripto", "Internacional",
]


def list_investimentos(mes_ref: str) -> list[dict]:
    with _connect() as conn:
        rows = conn.execute(
            "SELECT * FROM investimentos_snapshots WHERE mes_ref=? ORDER BY categoria",
            (mes_ref,),
        ).fetchall()
        return [dict(r) for r in rows]


def upsert_investimento(mes_ref: str, categoria: str, instituicao: str,
                        valor: float, aporte_mes: float = 0.0,
                        notas: str | None = None) -> None:
    with _connect() as conn:
        conn.execute(
            """INSERT INTO investimentos_snapshots
               (mes_ref, categoria, instituicao, valor, aporte_mes, notas)
               VALUES (?, ?, ?, ?, ?, ?)
               ON CONFLICT(mes_ref, categoria, instituicao)
               DO UPDATE SET valor=excluded.valor, aporte_mes=excluded.aporte_mes, notas=excluded.notas""",
            (mes_ref, categoria, instituicao or "", valor, aporte_mes, notas),
        )
        conn.commit()


def delete_investimento(inv_id: int) -> None:
    with _connect() as conn:
        conn.execute("DELETE FROM investimentos_snapshots WHERE id=?", (inv_id,))
        conn.commit()


def total_patrimonio(mes_ref: str) -> float:
    with _connect() as conn:
        row = conn.execute(
            "SELECT COALESCE(SUM(valor),0) FROM investimentos_snapshots WHERE mes_ref=?", (mes_ref,)
        ).fetchone()
        return float(row[0])


def historico_patrimonio(meses: int = 12) -> list[dict]:
    with _connect() as conn:
        rows = conn.execute(
            """SELECT mes_ref, SUM(valor) as total, SUM(aporte_mes) as aporte
               FROM investimentos_snapshots
               WHERE mes_ref <= strftime('%Y-%m', 'now')
               GROUP BY mes_ref
               ORDER BY mes_ref DESC LIMIT ?""",
            (meses,),
        ).fetchall()
        return [dict(r) for r in reversed(rows)]


def distribuicao_investimentos(mes_ref: str) -> list[dict]:
    with _connect() as conn:
        rows = conn.execute(
            """SELECT categoria, SUM(valor) as total
               FROM investimentos_snapshots WHERE mes_ref=?
               GROUP BY categoria ORDER BY total DESC""",
            (mes_ref,),
        ).fetchall()
        return [dict(r) for r in rows]


# ═══════════════════════════════════════════════════════════════════════════════
# CARTÕES — SPLITS POR CARTÃO (config persistente)
# ═══════════════════════════════════════════════════════════════════════════════

def list_cartao_splits(cartao_id: int) -> list[dict]:
    with _connect() as conn:
        rows = conn.execute(
            """SELECT cs.id, cs.pessoa_id, cs.ratio, p.nome, p.cor
               FROM cartoes_splits cs
               JOIN pessoas p ON p.id = cs.pessoa_id
               WHERE cs.cartao_id=? AND p.ativo=1
               ORDER BY p.nome""",
            (cartao_id,),
        ).fetchall()
        return [dict(r) for r in rows]


def set_cartao_splits(cartao_id: int, splits: list[dict]) -> None:
    """splits: lista de {pessoa_id, ratio}. Substitui config inteira."""
    with _connect() as conn:
        conn.execute("DELETE FROM cartoes_splits WHERE cartao_id=?", (cartao_id,))
        for sp in splits:
            r = float(sp["ratio"])
            if r <= 0 or r > 1:
                continue
            conn.execute(
                "INSERT INTO cartoes_splits (cartao_id, pessoa_id, ratio) VALUES (?, ?, ?)",
                (cartao_id, int(sp["pessoa_id"]), r),
            )
        conn.commit()


# ═══════════════════════════════════════════════════════════════════════════════
# SYNC CARTÃO CICLO → DESPESA
# ═══════════════════════════════════════════════════════════════════════════════

DESPESA_TIPO_CARTAO_CICLO = "cartao_ciclo"


def _aba_pessoal_id(conn: sqlite3.Connection) -> int | None:
    r = conn.execute(
        "SELECT id FROM abas_despesas WHERE nome='Pessoal' AND ativo=1 LIMIT 1"
    ).fetchone()
    return r["id"] if r else None


def _cleanup_cartao_ciclo(conn: sqlite3.Connection, cartao_id: int,
                           mes_ref: str | None = None) -> None:
    """Remove despesas cartao_ciclo + espelhos split_auto + divisao_entries.
    Se mes_ref None → limpa todos meses do cartão."""
    q_base = """SELECT id FROM despesas
                WHERE cartao_id=? AND tipo=?"""
    params: list = [cartao_id, DESPESA_TIPO_CARTAO_CICLO]
    if mes_ref is not None:
        q_base += " AND mes_ref=?"
        params.append(mes_ref)
    ids = [r["id"] for r in conn.execute(q_base, params).fetchall()]
    if not ids:
        return
    placeholders = ",".join("?" * len(ids))
    conn.execute(
        f"DELETE FROM divisao_entries WHERE origem_despesa_id IN ({placeholders})",
        ids,
    )
    conn.execute(
        f"DELETE FROM despesas WHERE origem_id IN ({placeholders}) "
        f"AND tipo='split_auto'",
        ids,
    )
    conn.execute(
        f"DELETE FROM despesas WHERE id IN ({placeholders})",
        ids,
    )


def sync_cartao_ciclo(cartao_id: int) -> dict | None:
    """Materializa ciclo atual do cartão como despesa.
    Idempotente: chamadas repetidas não duplicam.
    Retorna dict com info do que aconteceu, ou None se cartão inválido."""
    # Lazy import — evita ciclo
    from src import database as db_fat
    from src import database_acompanhamento as db_acomp

    cartoes = {c["id"]: c for c in db_fat.list_cartoes()}
    cartao = cartoes.get(cartao_id)
    if cartao is None or cartao_id == 1 or not cartao["ativo"]:
        # Cartão inválido/sentinela/desativado → limpa qualquer materialização antiga
        with _connect() as conn:
            _cleanup_cartao_ciclo(conn, cartao_id)
            conn.commit()
        return None

    snap = db_acomp.latest_snapshot(cartao_id=cartao_id)
    if not snap:
        with _connect() as conn:
            _cleanup_cartao_ciclo(conn, cartao_id)
            conn.commit()
        return {"status": "no_snapshot", "cartao_id": cartao_id}

    total = float(snap.get("total") or 0)
    if total <= 0:
        with _connect() as conn:
            _cleanup_cartao_ciclo(conn, cartao_id)
            conn.commit()
        return {"status": "zero_total", "cartao_id": cartao_id}

    # latest_snapshot já filtra por ciclo_atual() (WHERE ciclo_inicio/fim).
    # Snapshot retornado sempre corresponde ao ciclo atual → seguro derivar
    # mes_ref disso. Se snapshot for de outro ciclo, latest_snapshot retorna
    # None e cai no branch no_snapshot acima.
    _inicio_ciclo, _fim_ciclo = db_acomp.ciclo_atual()
    ciclo_fim = _fim_ciclo.isoformat()
    mes_ref = ciclo_fim[:7]  # "YYYY-MM"

    aba_id = cartao.get("aba_id")
    nome_cartao = cartao.get("nome") or f"Cartão #{cartao_id}"

    with _connect() as conn:
        # Resolve aba destino — default Pessoal se NULL
        if aba_id is None:
            aba_id = _aba_pessoal_id(conn)
            if aba_id is None:
                return {"status": "no_pessoal_aba", "cartao_id": cartao_id}

        aba = conn.execute(
            "SELECT id, nome, split_destino_categoria FROM abas_despesas WHERE id=?",
            (aba_id,),
        ).fetchone()
        if aba is None or not aba:
            aba_id = _aba_pessoal_id(conn)
            aba = conn.execute(
                "SELECT id, nome, split_destino_categoria FROM abas_despesas WHERE id=?",
                (aba_id,),
            ).fetchone() if aba_id else None
            if aba is None:
                return {"status": "no_pessoal_aba", "cartao_id": cartao_id}

        # Limpa qualquer materialização antiga (todos meses) para evitar
        # rows obsoletos quando aba mudou ou ciclo_fim trocou.
        _cleanup_cartao_ciclo(conn, cartao_id)

        descricao = f"Fatura {nome_cartao} — ciclo {mes_ref}"
        categoria_default = "Cartão"
        cur = conn.execute(
            """INSERT INTO despesas
               (aba_id, mes_ref, data, descricao, categoria, valor, notas, tipo,
                recorrente, em_fatura_cartao, cartao_id, somente_meu)
               VALUES (?, ?, ?, ?, ?, ?, NULL, ?, 0, 1, ?, 0)""",
            (aba_id, mes_ref, ciclo_fim, descricao, categoria_default,
             total, DESPESA_TIPO_CARTAO_CICLO, cartao_id),
        )
        despesa_id = cur.lastrowid

        # Split familiar? Só se aba tem split_destino_categoria configurado
        # E cartão tem splits cadastrados
        splits = []
        if aba["split_destino_categoria"]:
            splits = [dict(r) for r in conn.execute(
                """SELECT cs.pessoa_id, cs.ratio, p.nome
                   FROM cartoes_splits cs JOIN pessoas p ON p.id=cs.pessoa_id
                   WHERE cs.cartao_id=? AND p.ativo=1""",
                (cartao_id,),
            ).fetchall()]

        if splits:
            total_outros = 0.0
            for sp in splits:
                ratio = float(sp["ratio"])
                val_sp = round(total * ratio, 2)
                conn.execute(
                    """INSERT INTO despesa_splits
                       (despesa_id, pessoa_id, ratio, valor_calculado)
                       VALUES (?, ?, ?, ?)""",
                    (despesa_id, sp["pessoa_id"], ratio, val_sp),
                )
                conn.execute(
                    """INSERT INTO divisao_entries
                       (pessoa_id, mes_ref, descricao, valor_total, direcao,
                        origem_despesa_id)
                       VALUES (?, ?, ?, ?, 'a_receber', ?)""",
                    (sp["pessoa_id"], mes_ref, descricao, val_sp, despesa_id),
                )
                total_outros += ratio

            minha_ratio = max(0.0, 1.0 - total_outros)
            if minha_ratio > 0 and aba["split_destino_categoria"]:
                aba_pessoal = _aba_pessoal_id(conn)
                if aba_pessoal and aba_pessoal != aba_id:
                    meu_val = round(total * minha_ratio, 2)
                    conn.execute(
                        """INSERT INTO despesas
                           (aba_id, mes_ref, data, descricao, categoria, valor,
                            tipo, em_fatura_cartao, cartao_id, origem_id)
                           VALUES (?, ?, ?, ?, ?, ?, 'split_auto', 1, ?, ?)""",
                        (aba_pessoal, mes_ref, ciclo_fim,
                         f"[Split] {descricao}",
                         aba["split_destino_categoria"], meu_val,
                         cartao_id, despesa_id),
                    )

        conn.commit()
        return {
            "status": "synced",
            "cartao_id": cartao_id,
            "mes_ref": mes_ref,
            "total": total,
            "despesa_id": despesa_id,
            "aba_id": aba_id,
            "split_count": len(splits),
        }


def sync_all_cartoes() -> list[dict]:
    """Sync para todos cartões ativos. Retorna lista de resultados."""
    from src import database as db_fat
    results = []
    for c in db_fat.list_cartoes(only_active=True):
        if c["id"] == 1:
            continue
        r = sync_cartao_ciclo(c["id"])
        if r is not None:
            results.append(r)
    return results
