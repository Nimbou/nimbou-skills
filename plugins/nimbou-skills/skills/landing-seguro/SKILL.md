---
name: landing-seguro
description: 'Use quando o operador de uma corretora pede o conteúdo de uma landing page para um TIPO DE SEGURO (ex.: "landing de seguro de vida", "página de venda do seguro empresarial", "copy pra página de seguro auto", "gera a landing do seguro residencial"). Gera título, chamada, subtítulo, o que protege e FAQ para revisão humana, com coberturas pesquisadas e marcadas para confirmação, entregues em PDF. NÃO monta a página no CMS/Nuxt nem publica.'
---

# Landing de Seguro

Gera o conteúdo de uma **landing page comercial por tipo de seguro** para o operador de uma
corretora **revisar antes de publicar** — nunca é a página final, nunca vai direto ao ar.

**Princípio central: a copy não pode prometer o que a corretora não vende.** Toda cobertura,
preço, valor de capital, carência, lista de doenças, faixa etária ou número de processo SUSEP
que a skill não tenha recebido do operador entra marcada como `[CONFIRMAR: ...]`. Uma cobertura
inventada não é um rascunho a corrigir depois — é uma promessa falsa com cara de oficial, e
alguém vai comprar acreditando nela.

A saída (a copy) é em **Português - BR**. As instruções desta skill são em inglês; o resultado não.

## Portabilidade (Claude e ChatGPT)

Esta skill é **prosa autocontida**: o operador pode rodá-la no Claude Code/Codex **ou colar as
instruções no ChatGPT**. Por isso ela nunca depende de uma ferramenta específica. Onde precisa de
capacidade do ambiente (busca web, geração de PDF), ela diz "use a capacidade que o ambiente tiver"
e define o comportamento quando a capacidade **não** existe. Não assuma browsing nem PDF disponíveis
— confirme e degrade com clareza.

## O que esta skill NÃO faz

- Não cria módulo no nimbou-cms, não monta página Nuxt, não publica nada.
- Não afirma preço, capital segurado, carência, lista de doenças ou processo SUSEP como fato.
- Não pula a rodada de perguntas "porque o pedido parece óbvio".
- Não entrega sem PDF (a menos que o ambiente não consiga gerar um — ver abaixo).

## Processo

Siga as quatro etapas em ordem. Não gere a copy antes de fechar a Etapa 1.

### 1. Rodada curta de perguntas (obrigatória)

Antes de qualquer texto, faça **uma** rodada curta (use múltipla escolha quando o ambiente
oferecer, senão pergunte em texto). Não invente essas respostas — pergunte:

- **Público-alvo** do seguro (ex.: famílias com filhos, autônomos, MEIs, frota empresarial).
- **Ângulo / gancho principal** (proteção da renda, tranquilidade patrimonial, preço acessível, agilidade).
- **Coberturas/condições reais**, se o operador já tiver: cole-as e a skill redige em cima delas
  (viram fato, não `[CONFIRMAR]`). Se não tiver, a skill pesquisa e marca tudo.

Tom padrão é **direto e comercial (conversão)** com CTA claro — só mude se o operador pedir.

### 2. Pesquisa (com degradação explícita)

Se o ambiente tiver busca web ativa, pesquise para **este** tipo de seguro:
coberturas típicas no Brasil, dúvidas frequentes reais de quem contrata, e termos que o público usa.
Trate o resultado como **matéria-prima a validar**, nunca como verdade da corretora.

Se **não** houver busca web (ex.: ChatGPT sem browsing), diga isso ao operador em uma linha, use
conhecimento geral de mercado e marque **toda** cobertura como `[CONFIRMAR: ...]`.

Nunca afirme como fato, em nenhum cenário: preço, valor "a partir de", capital segurado, percentuais,
carências, faixa etária de aceitação, lista fechada de doenças, nomes de seguradora, número de
processo SUSEP. Esses só existem se o operador os forneceu.

### 3. Geração da copy

Produza, nesta estrutura e nesta quantidade:

- **Título** — 2 a 3 variantes (H1), para o operador escolher / testar A/B.
- **Chamada** — 2 a 3 variantes (linha de abertura do hero).
- **Subtítulo** — 1, apoiando o título, + um **CTA primário** e um **CTA secundário**.
- **O que ele protege** — bloco de coberturas em lista; cada cobertura em uma linha, benefício
  explícito; cada item não confirmado com `[CONFIRMAR: ...]`.
- **Perguntas frequentes** — 6 a 8 perguntas reais (contratação, preço, carência, beneficiários,
  sinistro, cancelamento, "por que com a corretora e não no app do banco"), respostas curtas, com
  `[CONFIRMAR: ...]` onde a resposta depende do produto ou de legislação vigente.
- **Bloco regulatório (SUSEP) — a confirmar** — lembrete listando o que é obrigatório antes de
  publicar: razão social/CNPJ da corretora, registro SUSEP do corretor, seguradora e nº do processo
  SUSEP do produto, a frase de registro automático da SUSEP, e link para as Condições Gerais.
  Recomende revisão de compliance/jurídico da seguradora.

O marcador é sempre exatamente `[CONFIRMAR: o que validar]` — visível, em linha, nunca escondido em
rodapé nem silenciosamente preenchido com um valor "plausível".

### 4. Entrega em PDF

Monte o conteúdo final num documento limpo e **gere um PDF** com a capacidade do ambiente
(no ChatGPT, o interpretador de código; no Claude, geração de PDF / conversão de Markdown).
O PDF é o entregável principal — nomeie por tipo de seguro (ex.: `landing-seguro-de-vida.pdf`).

**Busca web e geração de PDF são capacidades independentes.** Estar sem browsing (Etapa 2) não
significa estar sem PDF. Só degrade para Markdown quando a **geração de PDF em si** não existir no
ambiente — nesse caso, diga isso e entregue o mesmo conteúdo como Markdown pronto para impressão,
avisando que é o fallback. Nunca afirme que gerou um PDF que não gerou.

## Erros comuns

| Erro | Correção |
|------|----------|
| Gerar a copy sem a rodada de perguntas | Público e ângulo mudam toda a copy. Pergunte primeiro, sempre. |
| Listar coberturas da web como se a corretora as vendesse | Matéria-prima ≠ produto. Marque `[CONFIRMAR]` até o operador validar. |
| Preencher preço/capital/carência com número "plausível" | Isso é inventar. Só entra o que o operador forneceu; o resto é `[CONFIRMAR]`. |
| Uma variante só de título/chamada | Entregue 2–3 de cada — o valor da revisão é poder escolher. |
| Esquecer o bloco SUSEP | Seguro no Brasil é regulado. O lembrete regulatório é obrigatório na saída. |
| Entregar sem PDF sem avisar | PDF é o entregável. Sem capacidade, degrade para Markdown e diga que degradou. |

## Sinais de alerta — PARE

- Você começou a escrever o título e ainda não perguntou público/ângulo.
- Você escreveu um preço, uma carência ou uma faixa etária que ninguém te informou.
- Você removeu um `[CONFIRMAR]` só para o texto "fluir melhor".
- Você entregou coberturas específicas afirmando que a corretora as vende.

Qualquer um desses significa: volte à etapa que você pulou.
