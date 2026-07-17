---
name: plan-summary
description: Use quando um plano de ação (action-plan / plano-de-acao) já existe e um stakeholder que NÃO executa o plano — direção, gerência geral, patrocinador — precisa acompanhá-lo sem ler o documento de execução inteiro. Gera um PDF de uma página (altura dinâmica) com linha do tempo. Gatilhos "resumo executivo do plano", "versão de uma página pra gerência", "folha de acompanhamento", "linha do tempo do plano pra diretoria".
---

# Resumo Executivo de Plano de Ação

## Overview

Destila o `plano.json` do action-plan num **PDF de uma página** com cabeçalho, contexto, uma **linha do tempo** e blocos ilustrativos. A página tem **altura dinâmica**: cresce para caber o conteúdo (um PDF, uma página, de qualquer tamanho), então nunca transborda nem sobra branco.

**Princípio central:** o plano de execução e o resumo executivo **não são o mesmo documento em dois tamanhos — são documentos para pessoas diferentes.** O plano tem 5W2H, gatilhos e critérios porque quem o lê *executa*. O resumo é para quem só precisa entender rápido, sem dúvidas: o que é, o que vem, o que pode mudar. Encolher o plano produz um resumo ruim; **destilar** produz um bom.

**Meta:** ilustrativo e **suficiente** — o stakeholder não fica com dúvida nem perde tempo. Pode ter mais que o mínimo (detalhe das etapas, riscos-chave), desde que cada bloco ganhe o espaço que ocupa. O que NÃO entra: 5W2H, critérios de conclusão, jargão técnico, e a alocação de equipe.

## When to Use

- Já existe um plano (via action-plan / plano-de-acao) e há um stakeholder passivo que precisa acompanhar.
- O pedido é "uma página", "pra diretoria", "resumo", "linha do tempo do plano".

**NÃO use quando:**
- Ainda não há plano fechado → rode o action-plan primeiro.
- A audiência **executa** o plano → o próprio PDF do action-plan já é para ela.
- Pedem "fluxograma de como funciona" ou "do caminho de um dado" → isso é outro artefato (fluxograma explica *como*; esta skill mostra *quando*). Confirme antes.

## Divisão de trabalho

| Camada | Dona | O quê |
|---|---|---|
| **Julgamento** | você (o agente) | traduzir para linguagem de negócio; escolher os nós da timeline; escolher a caixa |
| **Layout** | `scripts/build_summary_pdf.py` | renderizar 1 página e **falhar alto** se transbordar |

Você monta um `resumo.json` enxuto (abaixo) e o script rende. O script **não** lê o `plano.json` — quem destila é você.

## Regra da linha do tempo (a substância desta skill)

A timeline é horizontal: cabe **no máximo 7 nós** na largura, não importa quão alta seja a página. Ela é o **arco visual**; o detalhe fino vai no bloco "detalhe" (abaixo), que a página cresce para acomodar.

| Plano tem fases? (`fases_futuras` ou `escopo.porte` grande/programa) | Nós da timeline |
|---|---|
| **Sim** | 1 nó por FASE (a ativa + cada `fases_futuras`), datado no fim de cada fase, **+ 1 nó de destino** com `objetivo.prazo` e o resultado do objetivo. |
| **Não** (pequeno/médio) | 1 nó por marco (`marcos[].prazo`), **+ 1 nó de destino** com `objetivo.prazo`. |

**O nó de destino nunca some** — é o ponto de chegada, a coisa que o stakeholder mais precisa ver. Se a última fase termina na mesma data do `objetivo.prazo`, funda os dois num nó só (rótulo do destino vence). Se couber no teto de 7, inclua o nó da **próxima revisão/decisão** (`kind: revisao`).

**`kind` de cada nó** (dá cor/preenchimento): `start` (dourado, primeiro), `revisao` (dourado cheio), `mid` (verde vazado), `destino` (verde cheio, último).

**Onde o detalhe da fase ativa aparece:** a timeline mostra só o arco macro. Quando o stakeholder precisa saber *o que cada etapa entrega*, use o bloco **`detalhe`** — uma lista vertical (nome + o que entrega + prazo), sem 5W2H. É ele que torna a folha "suficiente" sem inflar a timeline.

## Dois passos de julgamento (não são template)

1. **Traduza para linguagem de negócio.** O `plano.json` pode estar técnico. Reescreva rótulos e contexto sem jargão: nada de nomes de tabela, status de código, versões de release, "migrate", "SOP", "RBAC". Diga a consequência, não o mecanismo. Se você não sabe o que um termo significa em negócio, é sinal de que não deveria entrar.
2. **Escolha a caixa "o que pode mudar".** Uma só. Tire do que ameaça o `objetivo.prazo`: um `gatilhos_ajuste` sobre a data, uma `premissa` não validada que dimensiona o prazo, ou o risco de maior impacto. É o que protege o stakeholder de ser pego de surpresa. Não liste vários riscos — a folha é **magra por decisão**.

## resumo.json (entrada do script)

Só `titulo` e `timeline` são obrigatórios. `contexto`, `detalhe`, `caixas`, `riscos`, `rodape`, `subtitulo` são opcionais — inclua os que tornam a folha *suficiente* para a audiência, corte o resto.

```json
{
  "titulo": "Bolsas: saída do Zeev",
  "subtitulo": "Julho/2026 · Everton Andrade",
  "contexto": "1 a 4 frases em linguagem de negócio.",
  "timeline_titulo": "Linha do tempo",
  "timeline": [
    {"date": "20/07", "dow": "seg", "title": "Início", "desc": "Prova do cadastro\nde um termo real", "kind": "start"},
    {"date": "28/07", "dow": "ter", "title": "Revisão", "desc": "Aqui a data\nse confirma", "kind": "revisao"},
    {"date": "31/08", "dow": "seg", "title": "Zeev desligado", "desc": "Bolsa só\nno sistema", "kind": "destino"}
  ],
  "detalhe": {
    "titulo": "As etapas em detalhe",
    "itens": [
      {"nome": "Etapa 1 — Prova e lista", "entrega": "Prova de que o cadastro funciona e a lista completa dos termos vigentes.", "prazo": "até 04/08"},
      {"nome": "Etapa 2 — Carga e corte", "entrega": "Todos os termos migrados e conferidos, e o Zeev encerrado para bolsas.", "prazo": "até 31/08"}
    ]
  },
  "caixas": [
    {"titulo": "Sobre a data de 31/08", "texto": "Por que a data pode mudar.", "destaque": "A frase que o stakeholder precisa ouvir sob pressão de prazo."}
  ],
  "riscos": {
    "titulo": "O que a gestão precisa saber",
    "itens": ["Risco 1 em linguagem de consequência.", "Risco 2."]
  },
  "rodape": "Revisões semanais, terças 10h · Plano completo disponível se quiser o detalhe",
  "assinatura": "Everton Andrade"
}
```

`desc` aceita `\n` para quebrar em 2 linhas curtas. `dow` por nó é opcional. `caixas` aceita uma ou mais; `caixa` singular ainda funciona.

## Fluxo

1. Leia o `plano.json` (peça o caminho se não tiver).
2. Aplique a **regra da timeline** para escolher os nós; aplique os **dois passos de julgamento**.
3. Escreva o `resumo.json`.
4. Rode: `python scripts/build_summary_pdf.py resumo.json saida.pdf`
5. **Verifique olhando** (layout de PDF quebra fácil): renderize para PNG e leia a imagem. Ex.: `python -c "import pypdfium2 as p; p.PdfDocument('saida.pdf')[0].render(scale=2).to_pil().save('v.png')"` e abra `v.png`. Cheque: página proporcional ao conteúdo, timeline legível, zero jargão, e que ela é *suficiente* — a primeira dúvida da audiência já está respondida ali.

A página cresce sozinha para caber o conteúdo, então não há transbordo. O único **erro alto** é timeline com mais de 7 nós: nesse caso não engorde a timeline — mova o detalhe para o bloco `detalhe`.

## Common Mistakes

- **Um nó por marco num plano grande** → estoura os 7 nós da largura. Em plano com fases, é um nó por FASE + destino; o resto vai no bloco `detalhe`.
- **Perder o nó de destino** → a folha fica sem ponto de chegada; é o nó mais importante.
- **Copiar o plano em vez de destilar** → trazer 5W2H, critérios e gatilhos pra dentro. "Mais informação" é o bloco `detalhe`/`riscos` em linguagem de negócio, não o plano encolhido.
- **Rasa demais por medo de inflar** → a página cresce de graça; se falta algo para a audiência não ter dúvida, inclua (detalhe das etapas, riscos-chave). Suficiente > mínimo.
- **Deixar jargão técnico** → o stakeholder não lê "migrate"/"RBAC"/status de código. Traduza ou corte.
- **Gerar sem olhar o PNG** → altura correta não garante bom layout (linha órfã, título solto no fim). Sempre renderize e leia.
- **Confundir com fluxograma** → se pediram "como funciona", esta skill entrega a coisa errada com capricho. Confirme o artefato.
