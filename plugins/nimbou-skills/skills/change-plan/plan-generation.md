# Change Plan — Plan Generation

**Required:** Read and apply [Required scope and delivery summary](../fullstack-plan/scope-summary.md) before writing tasks and during self-review. Include its complete delivery summary in the saved plan and final chat response.

This path starts after `change-plan` classifies the work as **small** and closes the frontend and backend design. Check the recorded prototype decision and, when the user chose a prototype, its user-approved revision. If either is pending, return to `change-plan` before writing the plan. Produce one wave-structured plan and stop.

## Reuse, do not restate

Use the `fullstack-plan` format with the small-change rules below. Follow `nimbou-skills:fullstack-plan` for:

- **Wave Topology** — Contratos → Implementação → Wiring → Verificação.
- **Execution Contract** — every task carries `Role`, `Onda`, `Files`, `Consome`, `Estimativa`, `RED`, `Verificação`; no per-task commit steps.
- **Response Shape** and the **Self-Review** checklist.
- The platform-specific backend final verification: scoped `nestjs-test` for NestJS, or the declared scoped Laravel verification task from `laravel-plan`.

Backend tasks follow the planner detected from the repository: `nimbou-skills:nestjs-plan` or `nimbou-skills:laravel-plan`. Frontend tasks follow `nimbou-skills:nuxt-plan`. When this file and a platform planner disagree about a platform rule, the platform planner wins.

Frontend Playwright/browser E2E is opt-in: omit it from the plan and do not execute it
unless the user explicitly requested it. Backend verification may use Playwright when
appropriate. This covers persistent E2E coverage; the later `browser-smoke` runtime
may choose Playwright as its fallback driver. `typecheck` remains opt-in for both stacks.

## Small-change rules

1. **Design inputs.** Use the recorded frontend decisions, inline acceptance cases, and closed backend design. For visible changes, carry the approved prototype or the recorded visual reference and checks into the plan. This path uses no domain-artifact gate.

2. **Inline contract instead of `openapi.yaml`.** When the change alters HTTP, use an inline block for `**Contrato:**`. Every frontend `Consome` that uses the shared contract quotes from it:

   ```md
   ## Contrato (inline)
   - **Rota:** `PATCH /orders/:id/status`
   - **Request:** `{ status: 'shipped' | 'cancelled' }`
   - **Response 200:** `{ id, status, updatedAt }`
   - **Erros:** `409` estado inválido; `404` pedido inexistente
   ```

   When HTTP does not change, omit the block and cite the existing route as-is.

3. **Small by construction.** The Routing Gate already proved the work fits: ≤ 8 files and ≤ 2 roles per stack, one implementation wave, a one-pass contract, additive-only migration. If a threshold signal appears while writing the plan, use `change-plan`'s escalation path and carry forward applicable design decisions and approvals.

4. **Estimate for dispatch, not for task slicing.** Every task declares
   `**Estimativa:** curta | media | longa`, including its scoped verification.
   `curta` is eligible to share a same-Role lane; `media` and `longa` remain
   independent when write sets are disjoint. Keep one behavior and one `RED` per
   backend task: this field tells the executor whether setup-sharing is worth the
   lost overlap, never a reason to split behavior or lower an estimate artificially.

## Output

Write the plan to `docs/plans/<slug>/doc.md`, `<slug>` a short kebab-case name, using `fullstack-plan`'s Response Shape (with the inline `## Contrato (inline)` when HTTP changes). Run `fullstack-plan`'s Self-Review before handing off.

Then report the file path, closed decisions, and impact to the controller. The controller follows `../executing-plans/plan-session-handoff.md` to create the execution task when authorized.
