# ADR-0001: Streamlit como único framework de UI

- **Status:** Accepted
- **Data:** 2026-05-15

## Contexto

planejAÍ é um app desktop pessoal de gestão financeira. O único usuário é o próprio
desenvolvedor. Velocidade de entrega e iteração rápida são mais importantes do que
flexibilidade de componentes ou experiência de SPA.

## Decisão

Usar Streamlit como único framework de UI. Toda interface é declarada em Python puro,
sem HTML, CSS ou JavaScript escritos manualmente (exceto injeção pontual via
`st.markdown` quando necessário para aderir ao design system).

## Consequências

- Sem SPA: cada interação dispara um rerun completo da página.
- Componentes interativos complexos (drag-and-drop, edição inline, tabelas editáveis
  ricas) são difíceis ou impossíveis sem bibliotecas de terceiros.
- State management depende de `st.session_state`; lógica que precisa persistir entre
  reruns deve ser explicitamente armazenada lá.
- Deploy é trivial: `streamlit run app.py`.
- Produtividade alta para telas CRUD e dashboards — perfil dominante neste app.

## Alternativas consideradas

**Flask + HTMX:** mais controle sobre HTML/CSS, suporte a interações parciais sem
rerun completo. Descartado por exigir muito mais código boilerplate para o mesmo
resultado visual num app pessoal.

**Electron + Python (backend):** experiência desktop nativa, janela própria.
Descartado por overhead de empacotamento, dois processos para gerenciar e curva de
aprendizado desnecessária para uso solo.
