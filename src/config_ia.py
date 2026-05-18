"""
config_ia.py — Persistência criptografada de credenciais do provedor de IA.

Armazena provedor + token na tabela `config_ia` de gestao.db.
Chave Fernet gerada uma vez e salva em data/.key (fora do repositório).
Token nunca aparece em log, print ou comentário.
"""
from __future__ import annotations

import sqlite3
from pathlib import Path

from cryptography.fernet import Fernet

ROOT = Path(__file__).resolve().parent.parent
KEY_PATH = ROOT / "data" / ".key"
DB_PATH = ROOT / "data" / "gestao.db"

PROVEDORES = [
    "Claude — Anthropic (API Key)",
    "Claude — OpenClaude CLI (token local)",
    "OpenAI (API Key)",
    "Gemini — Google (API Key)",
]

_CREATE_TABLE = """
CREATE TABLE IF NOT EXISTS config_ia (
    id      INTEGER PRIMARY KEY,
    provedor TEXT    NOT NULL,
    token   TEXT    NOT NULL
);
"""


# ── Chave Fernet ──────────────────────────────────────────────────────────────

def _get_or_create_key() -> bytes:
    KEY_PATH.parent.mkdir(parents=True, exist_ok=True)
    if KEY_PATH.exists():
        return KEY_PATH.read_bytes().strip()
    key = Fernet.generate_key()
    KEY_PATH.write_bytes(key)
    KEY_PATH.chmod(0o600)
    return key


def _fernet() -> Fernet:
    return Fernet(_get_or_create_key())


# ── Criptografia ──────────────────────────────────────────────────────────────

def encrypt(value: str) -> str:
    return _fernet().encrypt(value.encode()).decode()


def decrypt(value: str) -> str:
    return _fernet().decrypt(value.encode()).decode()


# ── Banco ─────────────────────────────────────────────────────────────────────

def _connect() -> sqlite3.Connection:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.execute("PRAGMA foreign_keys = ON")
    conn.execute(_CREATE_TABLE)
    conn.commit()
    return conn


def save_config_ia(provedor: str, token: str) -> None:
    """Salva ou substitui a configuração de IA. Token é armazenado criptografado."""
    token_enc = encrypt(token)
    with _connect() as conn:
        conn.execute(
            "INSERT INTO config_ia (id, provedor, token) VALUES (1, ?, ?) "
            "ON CONFLICT(id) DO UPDATE SET provedor=excluded.provedor, token=excluded.token",
            (provedor, token_enc),
        )
        conn.commit()


def load_config_ia() -> dict | None:
    """Retorna {"provedor": str, "token": str} decriptado, ou None se não configurado."""
    with _connect() as conn:
        row = conn.execute(
            "SELECT provedor, token FROM config_ia WHERE id = 1"
        ).fetchone()
    if not row:
        return None
    try:
        return {"provedor": row[0], "token": decrypt(row[1])}
    except Exception:
        return None


def delete_config_ia() -> None:
    """Remove a credencial salva."""
    with _connect() as conn:
        conn.execute("DELETE FROM config_ia WHERE id = 1")
        conn.commit()


def has_config_ia() -> bool:
    """Retorna True se há credencial configurada."""
    with _connect() as conn:
        row = conn.execute(
            "SELECT 1 FROM config_ia WHERE id = 1"
        ).fetchone()
    return row is not None
