# ADR-0004: Sem autenticação no MVP

- **Status:** Accepted
- **Data:** 2026-05-15

## Contexto

planejAÍ roda localmente na máquina do desenvolvedor. É um app single-user: apenas
o dono do PC usa o app. Implementar autenticação no MVP adicionaria complexidade de
desenvolvimento sem agregar valor funcional para o caso de uso atual.

## Decisão

O MVP não implementa nenhum mecanismo de autenticação. O app sobe com
`streamlit run app.py` e está imediatamente acessível sem login, PIN ou qualquer
verificação de identidade.

## Consequências

- Qualquer pessoa com acesso físico ou remoto ao PC pode visualizar e editar todos
  os dados financeiros enquanto o app estiver rodando.
- O app não deve ser exposto na rede local ou na internet sem uma camada de proteção
  externa (ex.: túnel autenticado, VPN).
- Implementar autenticação futuramente é possível sem mudanças estruturais: Streamlit
  suporta `st.login` e provedores OAuth; a lógica de negócio não está acoplada à
  ausência de auth.

## Alternativas consideradas

**PIN local:** simples de implementar com `st.text_input(type="password")` +
hash em arquivo. Descartado no MVP por adicionar fricção no uso diário sem proteção
real (PIN em texto visível na tela num app local).

**Windows Hello / biometria:** integração nativa com o OS. Descartado por
complexidade de integração com Streamlit e dependência de hardware.

**Autenticação por arquivo de chave:** verificar presença de arquivo em path
configurado. Descartado por ser security theater sem valor real para uso solo.
