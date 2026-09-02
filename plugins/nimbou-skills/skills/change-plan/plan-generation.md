# Change Plan — Plan Generation

You are here because `change-plan`'s Routing Gate classified the work as **small**. Produce one wave-structured plan and stop.

## Reuse, do not restate

This plan is a `fullstack-plan` output with three deltas. Follow `nimbou-skills:fullstack-plan` for everything it already owns:

- **Wave Topology** — Contratos → Implementação → Wiring → Verificação.
- **Execution Contract** — every task carries `Role`, `Onda`, `Files`, `Consome`, `Estimativa`, `RED`, `Verificação`; no per-task commit steps.
- **Response Shape** and the **Self-Review** checklist.
- The scoped `nestjs-test` final wave (no `Role`).

Backend tasks follow `nimbou-skills:nestjs-plan` (Role Mapping, Clean Architecture, Prisma ownership, TDD `RED`). Frontend tasks follow `nimbou-skills:nuxt-plan` (Role Mapping, reuse, design resolution, `RED: n/a — frontend, coberto por review`). When this file and a platform planner disagree about a platform rule, the platform planner wins.

## The three deltas

1. **No Precondition Gate.** `fullstack-plan` requires approved `domain.md`, `.feature`, and `openapi.yaml`. This path requires none of them. Do not create domain artifacts and do not block waiting for them.

2. **Inline contract instead of `openapi.yaml`.** When the change alters HTTP, replace `fullstack-plan`'s `**Contrato:** docs/domain/.../openapi.yaml` line with an inline block, and every frontend `Consome` quotes from it:

   ```md
   ## Contrato (inline)
   - **Rota:** `PATCH /orders/:id/status`
   - **Request:** `{ status: 'shipped' | 'cancelled' }`
   - **Response 200:** `{ id, status, updatedAt }`
   - **Erros:** `409` estado inválido; `404` pedido inexistente
   ```

   When HTTP does not change, omit the block and cite the existing route as-is.

3. **Small by construction.** The Routing Gate already proved the work fits: ≤ 8 files and ≤ 2 roles per stack, one implementation wave, a one-pass contract, additive-only migration. If while writing you uncover a threshold signal you missed, **stop and escalate** — `feat-spec` for a new feature, `nestjs-think` / `nuxt-think` → `fullstack-plan` for an existing one — rather than growing the plan past the gate.

4. **Estimate for dispatch, not for task slicing.** Every task declares
   `**Estimativa:** curta | media | longa`, including its scoped verification.
   `curta` is eligible to share a same-Role lane; `media` and `longa` remain
   independent when write sets are disjoint. Keep one behavior and one `RED` per
   backend task: this field tells the executor whether setup-sharing is worth the
   lost overlap, never a reason to split behavior or lower an estimate artificially.

## Output

Write the plan to `docs/plans/change-plan-<slug>.md`, `<slug>` a short kebab-case name, using `fullstack-plan`'s Response Shape (with the inline `## Contrato (inline)` when HTTP changes). Run `fullstack-plan`'s Self-Review before handing off.

Then respond in chat with the file path and the closed decisions and impact — do not paste the whole file back. Recommend `nimbou-skills:executing-plans` (or `run-waves`) as the next step.
