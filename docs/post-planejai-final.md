# Criar um app com 6 agentes de IA em paralelo é mais fácil do que parece. O desafio real é a documentação, e é exatamente isso que eu te mostro aqui

**Criar o app com seis agentes de IA rodando em paralelo foi rápido e mais tranquilo do que eu imaginava. O trabalho de verdade foi montar a documentação que eles leem antes de executar. É aí que o projeto trava ou anda. Abaixo está o passo a passo que usei, do PRD ao deploy, incluindo onde quebrou.**

Isso veio de um curso da DIO sobre desenvolvimento com agentes de IA, que apliquei de ponta a ponta num projeto real: o planejAÍ, um gestor financeiro que está no ar com site e download em [planejai-gestor-financeiro.vercel.app](https://planejai-gestor-financeiro.vercel.app/), com código aberto em [github.com/soutes/planejai](https://github.com/soutes/planejai).

## Por que múltiplos agentes

O jeito comum de usar IA pra programar é pedir uma coisa, esperar, pedir a próxima. Funciona, mas você vira o gargalo. A abordagem que estudei é outra: vários agentes, cada um com um papel fixo, trabalhando ao mesmo tempo, como um time.

Só que um time não produz nada sem saber o que vai construir. O trabalho começa antes do código, com a documentação pronta: o que fazer e como fazer. Os agentes entram depois disso. E é exatamente essa documentação que a maioria pula, e onde tudo trava.

## A preparação

Antes de qualquer agente tocar no código, três entregas: o design, o PRD e o modelo de dados.

### Design

> Nível de IA: Básico - chatbot (nada de agentes ainda, só o chat mesmo)

Um rascunho de telas não precisa de ferramenta nenhuma pra começar. Pode ser num papel, num guardanapo, no verso de qualquer coisa. Tira uma foto e manda pro chatbot da sua preferência pedir pra converter em Excalidraw. Ou já começa direto no Excalidraw, só com blocos, sem se preocupar com visual.

Depois de ter o esboço, exporte como imagem e mande pro Claude Design. Ele transforma aqueles blocos num design completo. Disso saiu o handoff: o pacote com tokens, telas e assets que vira a referência visual de todo o projeto. É esse handoff que alimenta os próximos passos.

### Como montei o PRD sem travar

O PRD é o Documento de Requisitos do Produto (Product Requirements Document): descreve o que vai ser construído, por quê, o que entra e o que fica de fora do escopo. Ele trava muita gente porque parece que precisa ser um documento corporativo gigante. Não precisa. Pro objetivo aqui, que é alimentar os agentes, ele só tem que responder com clareza o que construir, pra quem, e o que fica de fora.

Esse documento é a base de tudo que vem depois. São o Product Owner e o Architect, os dois primeiros agentes, que leem o PRD e transformam em instrução executável pro time. Sem PRD claro, eles inventam, e quando seis agentes inventam ao mesmo tempo, o resultado é bagunça.

Foi assim que cheguei no meu:

**1. Parti do design, não da folha em branco.** O handoff do Claude Design já tinha as telas: dashboard mensal, controle de despesas, leitura de fatura de cartão e painel de investimentos. Cada tela virou um bloco de requisitos. O esboço visual resolve metade do PRD antes de você escrever uma linha.

**2. Rascunhei com a própria IA.** Joguei o handoff e uma descrição do produto no chat e pedi um rascunho de PRD, com uma regra firme: listar premissas e perguntar o que estava ambíguo, em vez de inventar. Isso transforma o PRD de "texto que eu escrevo do zero" em "texto que eu reviso e corrijo", que é muito mais rápido.

**3. Defini o que NÃO entra.** Essa foi a parte que mais economizou retrabalho. No planejAÍ, ficaram deliberadamente fora do escopo: gestão diária granular (cansa o usuário, que larga o app em poucos dias), leitura de recibo de compra por IA pelo mesmo motivo, multiusuário, versão mobile, sincronização em nuvem, e versões para Linux e Mac. Sem essa fronteira, os agentes tentam resolver coisas que você nem pediu.

**4. Incluí as decisões de base junto.** No mesmo documento entrou a stack (Next.js 15, Fastify, Prisma com SQLite), a estrutura de pastas, os endpoints e o modelo de dados. Num time grande isso ficaria separado, mas pra coordenar agentes funcionou bem ter tudo num lugar só.

A régua que usei pra saber se o PRD estava bom: se eu entregasse só esse documento pra um dev que nunca viu o projeto, ele conseguiria começar sem me perguntar nada? Quando a resposta virou sim, liberei pros agentes.

### Modelo de dados

> 🤖 **IA utilizada: chatbot**

Pedi pra IA gerar o ERD (Entity Relationship Diagram, o diagrama de entidades e relacionamentos do banco) em Mermaid a partir do PRD, mostrando o plano antes de escrever e justificando as escolhas. Salvei num arquivo e visualizei com o plugin de Mermaid no VS Code.

## Os primeiros dois agentes

> Nível de IA: Intermediário - agentes (aqui você sai do chat e cria seus primeiros agentes)

Com o PRD pronto, chegou a hora de subir de nível no uso da IA. Em vez de pedir uma coisa e esperar, você cria agentes com papéis fixos que leem a documentação e produzem sem precisar de você no meio.

Os dois primeiros não escrevem código: eles transformam o PRD no material que o resto do time vai executar.

- **Product Owner**: lê o handoff e o PRD e transforma em user stories, que são descrições curtas de cada funcionalidade do ponto de vista de quem vai usar o app. Formato clássico: "Como [usuário], quero [ação] para [objetivo]". São elas que guiam o que cada agente vai construir.
- **Architect**: lê o PRD e registra as decisões técnicas em ADRs (Architecture Decision Records), documentos curtos que explicam cada decisão de arquitetura: o que foi escolhido, por quê, e quais alternativas foram descartadas. Isso evita que o time questione ou refaça decisões já tomadas.

Pra registrar cada um, usei o comando `/agents` no Claude CLI.

Na criação, o CLI pergunta **"When should Claude use this agent?"**, que é o gatilho de quando o agente é acionado. No Product Owner: "use este agente para escrever user stories a partir do handoff e do PRD".

## Rodando o Product Owner e o Architect

Com os dois agentes criados, rodei cada um separadamente: primeiro o Product Owner gerou as user stories, depois o Architect gerou os ADRs. Cada um leu o PRD como fonte, então os dois trabalhos saíram alinhados. No fim pedi um resumo do que cada um entregou.

Aqui ainda é sequencial: um termina, o outro começa. O paralelismo de verdade vem no próximo passo, quando o time completo entra em campo.

## O que precisei pra rodar em paralelo

> Nível de IA: Avançado- time de agentes (aqui você sai do modo "escreve e espera" de vez)

Três coisas pra preparar o ambiente.

**Tmux**, pra dividir o terminal em painéis, um por agente. No Windows, instala via PowerShell.

**Habilitar os times de agentes** no `settings.json` do Claude Code: ligar a flag experimental dos agent teams e deixar o Tmux dividindo os painéis.

**Abrir a sessão:**

```bash
tmux new-session -s nome-da-sessao
```

E subir o Claude Code. Um aviso: existe a flag `claude --dangerously-skip-permissions`, que faz a IA executar sem pedir confirmação a cada passo. É ela que destrava o paralelismo, mas o "dangerously" não é à toa. Só uso dentro de um repositório versionado, com tudo commitado antes, numa pasta isolada, pra reverter qualquer coisa com `git restore`. Quem preferir manter as confirmações roda só `claude`.

## O time completo em paralelo

Um prompt cria todos os agentes de uma vez e os põe pra desenvolver back e front simultaneamente, a partir do PRD, do modelo de dados, das user stories e dos ADRs. A diferença pra etapa anterior é que agora ninguém espera ninguém: todos trabalham ao mesmo tempo, cada um na sua faixa.

- **Product Owner**: tira dúvidas de negócio.
- **Architect**: tira dúvidas técnicas e confere se a solução segue a arquitetura.
- **Backend Developer**: implementa a API, começando pelo que tem menos dependência.
- **Frontend Developer**: faz as telas e integra com o backend.
- **QA**: valida cada user story e abre bug quando algo não bate. Adicionei depois, e foi o que mais melhorou a qualidade.
- **Lead**: coordena e fecha o relatório de release.

A partir daí é acompanhar. Os agentes leem os documentos, se consultam quando empacam, o backend levanta a API, o frontend consome, o QA testa e o Lead amarra. No fim sai um relatório com o que foi entregue e os próximos passos.

## O que deu errado

- Dois agentes mexeram no mesmo arquivo e se atropelaram.
- Uma user story foi reprovada pelo QA três vezes seguidas.
- Tive que parar tudo e corrigir o PRD porque uma ambiguidade nele estava se espalhando pro time inteiro.

Os dois primeiros problemas são de coordenação, esperados num ambiente paralelo. O terceiro confirma a tese do título: o erro veio do documento, não do código. Quando a fonte de verdade está boa, o time acerta junto. Quando está furada, o erro se multiplica por seis ao mesmo tempo, e aí é pior que um dev errando sozinho.

## O que isso significa na prática

O gargalo não foi a IA escrever código. Foi a clareza dos documentos e a separação de responsabilidades, que são os mesmos problemas de um time de pessoas: especificação boa, papéis definidos, dependências respeitadas. Por isso o PRD recebeu a maior parte do esforço, e por isso ele é a parte difícil que o título menciona. Com o processo que descrevi aqui, ele deixa de ser um bloqueio e vira o atalho.

## O resultado

O planejAÍ roda local na máquina, sem nuvem, sem assinatura, sem anúncio. Tem dashboard com indicadores do mês, controle de despesas (parceladas, recorrentes, com divisão familiar), rendimentos, investimentos e leitura de fatura de cartão por IA (você joga o PDF e ele extrai e categoriza). Está no ar em [planejai-gestor-financeiro.vercel.app](https://planejai-gestor-financeiro.vercel.app/), com download, e o código aberto em [github.com/soutes/planejai](https://github.com/soutes/planejai), incluindo o PRD, os prompts e os handoffs que descrevi.

## Vamos conversar

Estou aberto a trocar ideia sobre desenvolvimento com agentes e sobre transição pra dados. Me chama no LinkedIn (https://www.linkedin.com/in/soutes/)
