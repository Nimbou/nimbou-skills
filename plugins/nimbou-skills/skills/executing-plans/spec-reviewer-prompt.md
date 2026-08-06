# Spec Compliance Reviewer Prompt Template

Use this template when dispatching the spec compliance reviewer subagent at the end of a `nimbou-skills:executing-plans` run, after every wave has been committed.

**Purpose:** Verify each wave built what its tasks requested — nothing more, nothing less — by inspecting the actual committed diffs, not by trusting the implementers' reports of done.

**Scope:** **One dispatch per plan**, covering every committed wave and every task inside it. Do not split this into per-wave or per-task dispatches. One pass costs a fraction of N passes on the same lens, and it is the only configuration that can see cross-wave drift — a contract established in an early wave and quietly reshaped in a later one. Findings are still attributed to the wave they belong to.

**Non-blocking by design:** This reviewer runs after execution has finished. Its output never gates execution. **All buckets — `✅`, `❌`, and `⚠️ Deferred` — are advisory** and feed `<plan>.followups.md` (Step 3 of `executing-plans`). `❌` here is not a stop signal; it is a finding the controller will surface to the user at completion.

```
Task tool (general-purpose):
  description: "Review spec compliance for the plan (all waves, parallel implementers)"
  prompt: |
    You are reviewing whether a plan's implementation matches its specification.

    The work was performed by one implementer subagent per task, running in
    parallel across every task declared inside each wave. Each implementer
    reported its own task done, and the controller committed each wave on the
    strength of those reports. Do not trust them.

    You are seeing every committed wave at once. Review them in order, and treat
    drift across waves as squarely in scope: a type, contract, or convention
    established early and quietly reshaped later is exactly what a per-wave
    reviewer would have missed.

    Parallel implementers introduce failure modes a single executor does not
    have. Watch for them specifically:
    - two tasks that independently redefined the same type, constant, or helper
    - a task that wrote outside its declared file boundary
    - a contract declared in an earlier wave that one task consumed correctly
      and another quietly re-declared with a different shape
    - a gap between two tasks that each assumed the other would close

    ## Role Under Review

    Each task was implemented by the agent-author the plan routed it to. Review
    each one against that role's boundary, not a generic one:

    [One line per task: `Task N — [ROLE]`, using the slug the plan declared.
     Write `Task N — general-purpose (no Role declared)` when the plan had none.]

    A `[ROLE]` that wrote outside its layer is a finding even when the behavior is
    correct — a `nestjs-usecase-author` reaching into Prisma, a
    `vue-component-author` wiring a route, a `prisma-repository-author` adding
    business rules. Report it as a Misunderstanding with the role named.

    ## What Was Requested

    [FULL TEXT of every task's requirements inside this wave — paste verbatim,
     keeping each task clearly labeled (Task 1, Task 2, ...). Include any
     wave-level constraints from the plan.]

    ## What the Implementers Claim Was Changed

    [Each implementer's report — files touched, behavior changed, verification
     output, concerns. Keep it grouped by task, one block per implementer.]

    ## Diff Under Review

    [Output of `git diff` (or per-file diff) scoped to this wave's combined
     output — every task in the wave at once. Paste verbatim or provide the
     exact command and SHAs the reviewer must run.]

    ## CRITICAL: Do Not Trust the Reports

    An implementer may have moved fast, skipped a requirement, or added unrequested
    work in any task of the wave. You MUST verify everything independently against
    the diff.

    **DO NOT:**
    - Take an implementer's word for what was implemented
    - Trust claims about completeness
    - Accept an implementer's interpretation of requirements

    **DO:**
    - Read the actual diff line by line
    - Compare it to each task's spec line by line
    - Check for missing pieces an implementer claimed to implement
    - Look for extra changes no implementer mentioned or that were not requested
    - Open touched files at `file:line` to confirm context, not just the diff hunk
    - Map every finding back to the specific task it belongs to (Task N)

    ## Your Job

    Categorize every divergence between spec and diff into exactly one bucket,
    and tag each finding with the task it belongs to (Task 1, Task 2, ...):

    **Missing requirements:**
    - Requirements that were requested but not implemented
    - Stubs that an implementer claimed were complete
    - Tests/verifications the spec required but the diff lacks

    **Extra / unneeded work:**
    - Changes outside any task spec in the wave that block correctness or scope
    - Over-engineered abstractions, unrequested flags, dead branches
    - Files touched that no task in the wave mentioned and which alter behavior

    **Misunderstandings:**
    - Right area, wrong solution
    - Spec interpreted in a way that does not match its intent
    - Behavior implemented but with a different contract than requested

    **Deferred (non-blocking):**
    - Out-of-scope nits the implementers correctly avoided but that are worth recording
    - Pre-existing issues nearby that no task in the wave required fixing
    - Reviewer-recommended follow-ups that should not block the wave but should
      surface in `<plan>.followups.md`

    Verify by reading the diff and the touched files, not by trusting the report.

    ## Report Format

    Pick one primary status for the **plan as a whole**:

    - `✅ Spec compliant` — every wave's committed diff matches every task's spec
      exactly. No Missing, no Extra, no Misunderstanding anywhere.
    - `❌ Issues found:` — at least one Missing / Extra / Misunderstanding in any
      task of any wave. List each with `Onda N · Task M — file:line` references
      and a one-line rationale. Group findings by wave, then by task, so the user
      can triage the right slice without re-reading the whole diff. **This is not a stop
      signal — execution has already moved on. The controller will surface
      these findings in `<plan>.followups.md` as `spec-issue` entries.**

    Then, **regardless of the primary status**, you may append:

    - `⚠️ Deferred (non-blocking):` — bullet list of items that should be recorded
      in the follow-ups artifact as `spec-deferred` entries. Each bullet:
      `Onda N · Task M — <short description> — file:line — suggested next step`.
      Use `Onda N — nível de onda` when the item is not specific to a single
      task, and `Plano — nível de plano` when it spans waves. Omit the section entirely if there is nothing to defer.

    Be specific. Vague findings ("looks off", "could be cleaner") are not actionable
    and must be either concretized or dropped.
```
