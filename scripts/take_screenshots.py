# -*- coding: utf-8 -*-
"""
Inicia Streamlit em background e captura 5 screenshots das telas principais.
Salva em Preview/screen_<nome>.png
"""
import subprocess
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PREVIEW = ROOT / "Preview"
PREVIEW.mkdir(exist_ok=True)

PORT = 8502
URL = f"http://localhost:{PORT}"


def wait_for_streamlit(timeout: int = 90) -> bool:
    import urllib.request
    deadline = time.time() + timeout
    while time.time() < deadline:
        try:
            urllib.request.urlopen(URL, timeout=2)
            return True
        except Exception:
            time.sleep(1)
    return False


def wait_idle(page, extra: float = 2.5) -> None:
    """Aguarda Streamlit parar de processar."""
    try:
        page.wait_for_selector('[data-testid="stStatusWidget"]', timeout=3000)
        page.wait_for_selector('[data-testid="stStatusWidget"]', state="hidden", timeout=20000)
    except Exception:
        pass
    time.sleep(extra)


def nav_to(page, label: str) -> None:
    """Clica no botao de navegacao da sidebar pelo texto exato."""
    sidebar = 'section[data-testid="stSidebar"]'
    btn = page.locator(f'{sidebar} button').filter(has_text=label)
    btn.first.click(timeout=10000)
    wait_idle(page)


def main() -> None:
    from playwright.sync_api import sync_playwright

    print("Iniciando Streamlit...")
    proc = subprocess.Popen(
        [sys.executable, "-m", "streamlit", "run", str(ROOT / "app.py"),
         "--server.port", str(PORT),
         "--server.headless", "true",
         "--server.runOnSave", "false",
         "--browser.gatherUsageStats", "false"],
        cwd=str(ROOT),
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )

    print("Aguardando servidor...")
    if not wait_for_streamlit(90):
        proc.kill()
        print("ERRO: Streamlit nao respondeu em 90s")
        sys.exit(1)

    print("Servidor pronto. Aguardando renderizacao inicial...")
    time.sleep(5)

    PAGES = [
        ("visao_geral",   None),                # primeira pagina — ja carregada
        ("rendimentos",   "Rendimentos"),
        ("despesas",      "Despesas"),
        ("investimentos", "Investimentos"),
        ("cartao",        "Cartão de Crédito"),
    ]

    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=True, args=["--font-render-hinting=none"])
        ctx = browser.new_context(
            viewport={"width": 1440, "height": 900},
            device_scale_factor=2,
            color_scheme="dark",
        )
        page = ctx.new_page()

        print("Carregando pagina inicial...")
        page.goto(URL, wait_until="networkidle", timeout=40000)
        wait_idle(page, extra=4)

        for page_id, btn_label in PAGES:
            print(f"Capturando: {page_id}...")
            if btn_label is not None:
                nav_to(page, btn_label)

            out = PREVIEW / f"screen_{page_id}.png"
            page.screenshot(path=str(out), full_page=False)
            size = out.stat().st_size // 1024
            print(f"  Salvo: {out.name} ({size}KB)")

        browser.close()

    proc.kill()
    print("Concluido! Screenshots em:", PREVIEW)


if __name__ == "__main__":
    main()
