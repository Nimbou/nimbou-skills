---
name: nuxt-design
description: Prototype pages or flows in Nuxt or local HTML, review a local HTML prototype, redesign Nuxt/Vue component families, or apply an approved visual redesign. Use nuxt-component-harden for isolated Vitest Browser Mode validation.
---

# Nuxt Design

Read the nearest `DESIGN.md` and `GUIDELINES.md` for the target area, the installed stack, the existing components, and the catalog if available. Use the product's tokens, wrappers, and interaction conventions. Consult `nimbou-skills:modern-web-guidance` when layout, HTML, browser APIs, motion, or accessibility decisions need verification.

## Choose the workflow

- **Isolated prototype of a page, screen, or flow:** follow the steps below. For a branded component demo, also consult the [component redesign workflow](reference/component-redesign.md).
- **Redesign of an existing component family or application of an approved design:** follow the [component redesign workflow](reference/component-redesign.md), including the rendering and navigation checks in real consumers.
- **Comparison of several directions:** use `nimbou-skills:craft-explore`. For shared tokens or component design decisions, consult `nimbou-skills:nuxt-think` in design system mode.
- **Read-only review:** for a standalone HTML prototype, follow the [visual critique checklist](../nuxt-audit/reference/visual-critique.md) and report findings. For an existing Nuxt implementation, use `nimbou-skills:nuxt-audit`.
- **Isolated component matrix in Vitest Browser Mode:** use `nimbou-skills:nuxt-component-harden`. New production features that require product or contract decisions follow `nimbou-skills:nuxt-think`.

## Build and review a prototype

For `feat-spec` or `change-plan`, use the fullstack prototype coverage below as you work through these steps.

1. Identify each screen, its audience, its job, and its main action. Ask about choices that materially affect an unresolved direction. When the user asks to create or update the visual rules, use `nimbou-skills:craft-setup`. A bounded prototype can proceed with stated assumptions when guides are missing.
2. Use the [state inventory](../nuxt-think/reference/interface-states.md) to identify the states worth showing. Use representative fictional data, including long labels and realistic counts. Show complete screens for states that change most of the layout and focused examples for local states such as a row error.
3. Build in an existing preview surface or an isolated local demo. Reuse installed Nuxt components and tokens when available. Use local HTML/CSS when there is no suitable Nuxt surface. Keep sample interactions local to the prototype. For a requested visual guide that mirrors code, use `nimbou-skills:craft-sync`.
4. Render the main screen and applicable states at representative widths. Use the [visual critique checklist](../nuxt-audit/reference/visual-critique.md), repair scoped findings and compare a fresh render using the same data and viewport. Use the available Codex browser for real rendering. Record which states or widths still lack browser evidence.
5. Deliver the demo path, the design decisions, the states and widths checked, and any open choices. Applying the prototype to product code requires an implementation request or an existing approval that includes application.

## Prototype for fullstack planning

When `feat-spec` or `change-plan` calls for a prototype, cover every in-scope screen and every applicable state. Map each Gherkin scenario or inline acceptance case to the prototype routes or screens, dialogs or steps, role variants, and visible states that let the user experience it. For a small change, scope coverage to the affected flow and its states. Add applicable interface states from the inventory, including loading, empty, error, success, and permission differences. Mark states outside the requested scope in the coverage list.

Build a runnable demo with representative fictional data and local interactions before backend design. Connect the flow and provide deterministic ways to reach every state, such as a scenario menu, fixture switch, or direct link. Show local states in the screen where they happen. Render and inspect every covered screen and state, including supported layout variants where they affect the result. Track the route or control for opening each case, widths checked, and evidence or verification gaps. Return the demo and coverage to the calling workflow for user approval.
