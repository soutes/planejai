# ADR-0005: Design system como referência imutável

- **Status:** Accepted
- **Data:** 2026-05-15

## Contexto

O projeto tem um design system documentado (`planejA_ Design System/`) produzido
como handoff de design — paleta, tipografia, espaçamentos, componentes visuais.
Sem uma regra clara de ownership, é tentador editar o CSS de produção diretamente
e deixar o handoff defasado, criando drift visual gradual entre referência e
implementação.

## Decisão

O diretório `planejA_ Design System/` é tratado como referência imutável: nunca
editado diretamente durante o desenvolvimento. Toda mudança de aparência começa
com uma atualização no handoff (ou decisão documentada de divergir), e depois é
implementada em `src/ui.py` (injeção de CSS/HTML via Streamlit).

## Consequências

- `src/ui.py` é o único ponto de implementação visual; é lá que o CSS customizado
  vive.
- Qualquer divergência entre handoff e implementação é intencional e rastreável
  (commit message, ADR ou comentário em `ui.py`).
- O handoff serve como documentação viva do design; designers ou colaboradores
  futuros têm uma fonte de verdade confiável.
- Pull requests que tocam `src/ui.py` devem referenciar qual seção do handoff
  estão implementando ou de qual estão divergindo conscientemente.

## Alternativas consideradas

**Editar diretamente o CSS de produção:** mais rápido para ajustes pontuais.
Descartado porque em semanas o handoff fica desatualizado e perde valor como
referência, tornando impossível auditar o que foi implementado vs. o que foi
especificado.
