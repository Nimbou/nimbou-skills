---
name: nuxt-design-posture
description: Use when the composition is already framed and the remaining decisions are micro-aesthetic — font selection, color tokens, spacing scale, motion techniques, and forbidden CSS patterns (border-left stripes, gradient text). Pairs with nuxt-design-composition (macro hierarchy, landing vs product UI) and /design-md (project guardrails).
---

# Nuxt Design — Posture

## Overview

Disciplina de micro-detalhes estéticos para interfaces Nuxt/Vuetify: o que pintar (fonte, cor, escala, padrão CSS), não o que montar. Composição, hierarquia e sequência de página são tratadas em `nuxt-design-composition`.

## When to Use

- Decidindo fonte, paleta, tokens de espaçamento, easing, bans CSS.
- `nuxt-design-composition` já fechou a hierarquia macro e falta o tratamento fino.
- `/design-md` precisa fechar tokens e guardrails visuais concretos no `DESIGN.md`.

## When NOT to Use

- Hierarquia de página, hero, sequência de seções, landing vs product UI → `nuxt-design-composition`.
- Estrutura de componentes de uma feature → `nuxt-think`.
- Correção de bug visual pontual → `nuxt-debug`.

## Pré-condição

Antes de qualquer decisão de token, o **Working Model** (visual thesis, content plan, interaction thesis) precisa estar escrito — ver `nuxt-design-composition`. Se não estiver, pare e feche lá primeiro.

## Onde estão as regras

`reference/posture-rules.md` carrega as decisões concretas: tipografia (incluindo o procedimento de seleção de fonte e o tratamento de texto em dark), cor e seleção de tema em OKLCH, tokens de espaçamento, os **Absolute Bans** de CSS, detalhes visuais, técnicas de movimento e integração com Vuetify 3.

Leia esse arquivo antes de escrever qualquer token, nome de fonte ou regra CSS. As Red flags abaixo são o resumo verificável; elas não substituem a referência.

## Contrato com skills e artefatos

- **`nuxt-design-composition`**: define a arquitetura visual (hierarquia, hero, sequência, landing vs product UI). Esta skill preenche-a com tokens, fontes, cores e técnicas.
- **`nuxt-design-architecture`**: decompõe a UI em componentes/composables/utils. Ortogonal a esta skill — arquitetura ≠ estética.
- **`nuxt-think`**: consulta esta skill ao preencher `Direcao visual` da feature, depois de `nuxt-design-composition` fechar a estrutura.
- **`/design-md` (comando)**: esta skill é fonte dos tokens e guardrails visuais do `DESIGN.md`.
- **`DESIGN.md` do projeto**: quando existir, vence em conflito. Esta skill justifica, não substitui.

## Red flags — pare e reconsidere

- Fonte padrão do Vuetify porque "é rápido".
- Fonte da lista `reflex_fonts_to_reject` como escolha final.
- Cor base em HSL em vez de OKLCH.
- Chroma alto em lightness extrema (≥0.12 acima de 85% L).
- Gradiente roxo → rosa sobre branco "porque fica bonito".
- `border-left: > 1px` em card, callout, alerta ou list item.
- `background-clip: text` com gradiente em heading.
- Mesmo token de spacing em tudo (sem ritmo).
- Default dark ou light sem relação com contexto de uso.
- Texto em dark sem tintagem (cinza neutro puro sobre fundo escuro tintado).
- Hierarquia tipográfica em dark sustentada só por lightness.
