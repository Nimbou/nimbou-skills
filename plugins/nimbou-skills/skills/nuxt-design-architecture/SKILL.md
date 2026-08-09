---
name: nuxt-design-architecture
description: Use when deciding how to decompose a Nuxt 4 + Vuetify 3 interface into components, composables, utils, and config — component tiers, SOLID boundaries, extraction heuristics, and communication contracts. Pairs with nuxt-design-posture (micro visual) and nuxt-design-composition (macro hierarchy). Local GUIDELINES.md wins on implementation conflict.
---

# Nuxt Design — Architecture

## Overview

Disciplina de decomposição de interfaces Nuxt/Vuetify em componentes, composables, utils e config. Foco em SOLID aplicado ao frontend Vue 3: onde cortar, o que cada camada owns, como comunicar entre níveis.

Esta skill é a fonte genérica. O `GUIDELINES.md` do projeto vence em conflito de implementação — vide `Contrato` no fim.

## When to Use

- Decidindo criar componente novo vs reutilizar/ampliar existente.
- SFC crescendo além do confortável — decidir quando e onde cortar.
- Escolhendo entre composable, util, config ou plugin.
- Modelando comunicação: props, emits, v-model, slots, provide/inject ou store.
- `nuxt-think` precisa fechar "Componentes a reutilizar / a criar / Composables".
- `nuxt-audit` auditando "Componentização e ownership".
- `/design-md` preenchendo a seção **Component Architecture** do `GUIDELINES.md`.

## When NOT to Use

- Escolha de fontes, paleta, tokens CSS, padrões visuais banidos → `nuxt-design-posture`.
- Hierarquia de página, hero, landing vs product UI, motion ritmo → `nuxt-design-composition`.
- Decisão por feature específica (reutilizar qual componente, quais emits) → `nuxt-think` (que consulta esta skill).
- Correção de bug funcional → `nuxt-debug`.

## Pré-condição

O **Working Model** (visual thesis, content plan, interaction thesis) precisa estar escrito — ver `nuxt-design-composition`. Decisão de arquitetura sem content plan tende a quebrar nos próximos dois commits.

Antes de propor uma nova estrutura, verifique se o projeto já tem `GUIDELINES.md` com wrappers, primitives, naming, state patterns, extraction heuristics, ou anti-padrões locais. Quando existir, ele vence sobre esta skill.

## Onde estão as regras

`reference/architecture-rules.md` carrega as decisões concretas: component tiers, extraction heuristics, SOLID por camada, contratos de comunicação, regra de níveis (prop drilling vs provide vs store), localidade de estado, composable vs util vs config vs plugin, página vs domain component, reuso antes de invenção, naming defaults, testabilidade como critério, refactor triggers e anti-padrões.

Leia esse arquivo antes de propor qualquer estrutura. As Red flags abaixo são o resumo verificável; elas não substituem a referência.

## Contrato com skills e artefatos

- **`nuxt-design-posture`**: fonte para micro estética (fontes, cor, tokens, CSS bans). Ortogonal a esta skill.
- **`nuxt-design-composition`**: fonte para hierarquia macro (hero, landing vs product UI, motion ritmo). Esta skill preenche os componentes que a composition organiza.
- **`nuxt-think`**: consulta esta skill + `GUIDELINES.md` local ao fechar "Componentes a reutilizar / a criar / Composables".
- **`nuxt-audit`**: audita "Componentização e ownership" contra `GUIDELINES.md` primário; esta skill é fallback para dimensões não declaradas localmente.
- **`/design-md` (comando)**: usa esta skill como fonte da seção **Component Architecture** do `GUIDELINES.md`.
- **`GUIDELINES.md` do projeto**: quando existir, vence em conflito. Esta skill é a postura genérica/fallback.

## Red flags — pare e reconsidere

- SFC passou de 300 linhas e "tá funcionando".
- Componente com 15+ props, todos opcionais, com lógica `if` interna baseada neles.
- Composable que aceita elemento DOM como argumento.
- Util importando `ref`, `reactive` ou `computed`.
- Mixin (não existe razão em Vue 3).
- Page com 40 handlers, metade delegando para `$refs.something.doX()`.
- `v-model` apontando para prop recebida sem emit correspondente.
- Domain component importando Pinia direto quando o parent já tem o estado.
- Emit com nome genérico (`update`, `change`, `event`) em vez de semântico (`status-toggled`, `archive-requested`).
- "Isso vai ser reutilizado no futuro" — especulação. Espere o segundo consumidor real.
