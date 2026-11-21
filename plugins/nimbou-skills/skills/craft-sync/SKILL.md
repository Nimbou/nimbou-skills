---
name: craft-sync
description: Import Nuxt/Vuetify or web design tokens and selected components into a local visual guide, or compare and apply approved guide changes back to source using design-sync.json.
---

# Craft Sync

Resolve the app or UI package, the local guide and the direction of sync. Read the nearest `DESIGN.md`, `GUIDELINES.md`, and any existing `design-sync.json` at the resolved root. Use `nimbou-skills:craft-setup` for documentation-only requests. Use `nimbou-skills:nuxt-think` for proposals about new shared tokens or components.

## Import from code into the guide

1. Inventory canonical token sources, existing guide values, and component variants and states. For Nuxt, inspect the Vuetify theme definitions, CSS variables, local wrappers and component catalog when present. Distinguish editable source from generated CSS. Ask which source or components to import when the request and repository leave this ambiguous. Identify conflicts before changing existing guide values.
2. Use the existing guide or a local guide under `docs/design/guide/`. Prefer an existing Nuxt preview when available, or create a local HTML guide. Include foundations, a component index with source paths and variants, and examples of selected components. Keep an editable copy of guide token values so a later comparison can detect independent edits. Label states absent from code as proposed and keep them out of export.
3. Render the guide and compare the selected components against the app at matching widths and states when available. Record unverified comparisons and update the [sync record](reference/sync-record.md) for agreed values and component status.

For an explicitly requested single component in an existing guide, add its examples and update its index and status entry. Keep the existing foundations and token record.

## Export from guide into code

1. Read the current guide and canonical code. Compare each value against the [sync record](reference/sync-record.md). List differences, proposed edits, source locations and affected consumers. For color changes include the relevant contrast check.
2. Ask for decisions on unresolved differences and get approval for the proposed changes before applying them. If an authorized diff already covers the current values, use it. Reread the relevant values before applying and surface any newly divergent changes for resolution.
3. Apply the agreed changes to their owners. Edit source inputs for generated tokens and regenerate through the existing project workflow when required. Run the relevant project checks and verify the new values on both sides before updating the record. Report remaining conflicts or failed checks.
