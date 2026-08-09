---
name: nuxt-design-composition
description: Use when shaping the overall composition, hierarchy, and narrative of a Nuxt 4 + Vuetify 3 interface — landing pages, first viewports, page sequences, or product UI shells (dashboards, admin, workspaces). Pairs with nuxt-design-posture for micro aesthetic details (fonts, color tokens, CSS bans).
---

# Nuxt Design — Composition

## Overview

Disciplina de composição macro: o que montar, em que hierarquia, em que sequência. Landing page vs product UI são tratados como modos distintos. Detalhes estéticos (fontes, cor, tokens) são fechados em `nuxt-design-posture`.

## When to Use

- Definindo o primeiro viewport de uma landing / marketing page.
- Desenhando a shell de um dashboard, admin ou workspace operacional (product UI).
- Revisando uma página que "tem as peças certas" mas não se sustenta.
- `/design-md` precisa preencher a composição visual do `DESIGN.md` e o mapeamento de modo no `GUIDELINES.md`.

## When NOT to Use

- Escolha de fontes, paleta, tokens de espaçamento, padrões CSS banidos → `nuxt-design-posture`.
- Estrutura de componentes de uma feature específica → `nuxt-think`.
- Correção de bug visual → `nuxt-debug`.

## Working Model (antes de codar)

Escreva estas 3 coisas primeiro:

- **Visual thesis**: uma frase descrevendo mood, material e energia.
- **Content plan**: para landing — hero, support, detail, final CTA. Para product UI — workspace, navigation, inspector/context, ações.
- **Interaction thesis**: 2-3 ideias de motion que mudam a sensação da página.

Cada seção ganha um único job, uma única ideia visual dominante, um único takeaway ou ação.

Classifique também o **modo**: `landing` (marketing, brand-led, imagery-first) ou `product UI` (operacional, utility-first, dense-readable). As regras adiante mudam conforme o modo.

## Onde estão as regras

`reference/composition-rules.md` carrega as decisões concretas: o first viewport como pôster, o tratamento de landing pages, o de product UI (dashboards, admin, workspaces), utility copy, a decisão macro sobre cards, imagery, copy, motion target, as hard rules e as falhas a rejeitar.

Leia esse arquivo antes de definir a sequência de seções. Os Litmus Checks e o AI Slop Test abaixo são a verificação final; eles não substituem a referência.

## Litmus Checks (revisão final)

- A marca ou produto é inconfundível no primeiro screen?
- Existe um único visual anchor forte?
- A página é entendível escaneando apenas os headlines?
- Cada seção tem um job?
- Os cards são realmente necessários?
- Motion melhora hierarquia ou atmosfera (ou é ornamental)?
- O design ainda pareceria premium se todos os drop shadows decorativos fossem removidos?
- **Em product UI**: um operador entende a página escaneando só headings, labels e números?

## AI Slop Test

Se você mostrasse essa interface para alguém e dissesse "AI fez isso", acreditariam imediatamente?

Se sim, é o problema. Interface distintiva faz alguém perguntar "como isso foi feito?", não "qual AI fez?".

## Contrato com skills e artefatos

- **`nuxt-design-posture`**: responsável pelos micro-detalhes estéticos (fontes, cor, tokens, CSS bans, motion techniques). Esta skill define a arquitetura visual; posture a preenche.
- **`nuxt-design-architecture`**: responsável pela decomposição em componentes/composables/utils (tiers, SOLID, extração, contratos). Esta skill organiza a página; architecture organiza o código por trás dela.
- **`nuxt-think`**: consulta esta skill quando o request envolve landing, hero, estrutura de página, ou shell de product UI.
- **`/design-md` (comando)**: esta skill é fonte da seção **Layout** do `DESIGN.md` e da seção **Mode and Route Mapping** do `GUIDELINES.md`; posture fecha micro estética; architecture fecha implementação.
- **`DESIGN.md` do projeto**: quando existir, vence em conflito visual.
