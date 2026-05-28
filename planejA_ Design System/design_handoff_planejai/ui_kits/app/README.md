# UI Kit — planejAÍ app

High-fidelity recreation of the shipping Streamlit app, in plain React +
CSS. It is **cosmetic, not real**: components don't read from the SQLite
DB, the OCR/PDF agents are stubbed, and most state is in memory.

The point of the kit is to give the agent (or you) a set of clean
components for **new screens / new flows** in planejAÍ's visual language.

## Files

| File | What's in it |
|---|---|
| `index.html` | Entry point — wires up the app shell, picks a page, sets month |
| `Sidebar.jsx` | 220-px sidebar with logo, month stepper, nav rows |
| `Components.jsx` | `KPICard`, `GlowKPI`, `BigProgress`, `ProgressCategorias`, `AlertLine`, `ExecSummary`, `BankChip`, `Tabs`, `SectionH`, `fmtBRL` |
| `Pages.jsx` | `VisaoGeral`, `CartaoPage` (with 3 tabs), placeholders for Rendimentos / Despesas / Investimentos / Configurações |
| `kit.css` | Kit-specific layout (sidebar, KPI row grid, tabs, vencimentos grid). Pairs with `../../components.css` for token-level styles. |

## How to use

Drop a new page into `Pages.jsx`, register it in the sidebar nav array
(`Sidebar.jsx`) and the switch in `index.html`. Use the components from
`Components.jsx` for KPIs, progress bars, alerts. Stay inside the color
tokens in `colors_and_type.css`.

## Things deliberately omitted

- Real OCR / PDF upload (the file uploaders show stub state only).
- Plotly charts — replaced by static SVG donut and bar specimens with the
  same color spec.
- Settings tabs (the real app has 6 deep editor tabs — out of scope).
- Edit-categories `st.data_editor` flow.
