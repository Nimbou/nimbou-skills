# Implementer Subagent Prompt Template

Use this template when the controller fans a wave's tasks out under `nimbou-skills:executing-plans` (Step 2.2). **One dispatch per task**, all dispatched together in a single message so they run in parallel.

**Purpose:** Implement exactly one task from the plan, inside a declared file boundary, driven by its own failing test, and prove both the red run and the green one.

**Precondition:** the controller already checked write sets (Step 2.1). Every implementer in a wave owns a disjoint set of files. If two tasks share a file, they were merged into one dispatch before reaching this template.

**Agent type:** `[ROLE]` — the slug the plan declared for this task (`**Role:**` line in `nestjs-plan`, `Role` column in `nuxt-plan`). See the Role Routing table in `SKILL.md`. When the plan declared none, `[ROLE]` is `general-purpose` and the controller says so in the wave report.

**Isolation:** the implementer never inherits the controller's session history. Everything it needs is constructed below.

```
Task tool ([ROLE]):
  description: "Onda N — Task M: <short title>"
  prompt: |
    You are implementing exactly one task from an approved implementation plan.
    Other implementers are working on other tasks of the same wave, in parallel,
    in this same repository. Stay inside your file boundary.

    ## Your Task

    [The task's FULL text — requirements, code blocks, file paths, signatures.
     Never summarize it. Deliver it one of two equivalent ways:

     - paste it verbatim, when you already have the plan in context; or
     - point at it: `Read("<plan path>", offset: <task start line>, limit: <task
       line count>)`, which is what `run-waves` does. Re-emitting a plan's prose
       just to paste it back costs the whole document in output tokens.

     When pointing, add: if the first line read is not this task's heading, `Grep`
     the plan for the heading and read from there; if the task still cannot be
     found, report a blocker rather than implementing a guess.]

    ## Files You Own

    [Explicit list of every file this task creates or modifies.]

    You may READ anything in the repository. You may WRITE only to the files
    listed above. If the task cannot be completed without writing outside that
    list, STOP and report the blocker instead of widening the boundary — another
    implementer may own that file right now.

    ## Contracts You Consume

    [Types, signatures, routes, DTOs, schema fields produced by earlier waves
     that this task depends on. Paste the actual declarations, not references to
     them — the implementer cannot see the earlier waves' work in context.]

    Use these exactly as declared. Do not redefine, widen, or "improve" them.
    If a contract you were given does not match what is on disk, STOP and report
    the mismatch — it means an earlier wave diverged.

    ## Test First — Before Any Implementation

    Write the task's test first, then run:

    ```
    [The task's declared RED command, exactly as the plan wrote it, together
     with the failure class the plan declared it must produce.]
    ```

    Rules:
    - The failure must be the declared one. A test that fails because a module
      cannot be imported, a provider cannot be resolved, or the file does not
      parse never exercised the behavior and proves nothing. Fix the test until
      it fails for the behavior it is meant to drive out — that is not a red run
      to report, it is one to correct.
    - Only then implement, minimally, until it passes.
    - When the task declares `RED: n/a`, report that string with the plan's
      reason. Do not invent a test to fill the field.

    ## Verification

    Run this command, verbatim, when your implementation is in place:

    ```
    [The task's declared verification command, exactly as the plan wrote it.]
    ```

    Rules:
    - Run it as written. Never widen it to an unfiltered suite run
      (no bare `pnpm test`, `npm test`, `pytest`).
    - Do not commit. The controller commits the whole wave at once.
    - If it fails, fix your implementation and run it again.
    - If it keeps failing for a reason outside your file boundary, STOP and
      report — do not edit files you do not own to make it pass.

    ## Scope Discipline

    DO:
    - Implement what the task specifies, completely.
    - Follow the repository's existing conventions in the files you touch.
    - Report anything you noticed but correctly left alone.

    DO NOT:
    - Implement adjacent tasks because they look related — they belong to
      other implementers running right now.
    - Refactor code the task did not ask you to change.
    - Add flags, abstractions, or configuration the task did not request.
    - Fix pre-existing issues you spot nearby. Report them as concerns instead.

    ## Report Format

    Return exactly this structure. Your report is read by the controller to
    decide whether the wave can be committed.

    **Status:** `DONE` | `DONE_WITH_CONCERNS` | `BLOCKED`

    **Files touched:** one line per file, with what changed in it.

    **Behavior changed:** what is observably different now, in one or two lines.

    **Red run:** the RED command, its ACTUAL output, and one line on why that
    output proves the test was real. The failing assertion or error is what
    matters — do not paste the whole transcript. If you implemented before
    running red, say so plainly; an honest report is recoverable, a fabricated
    one is not.

    **Verification:** the command you ran and its actual output. Paste the real
    output — a claim that it passed is not evidence.

    **Concerns:** anything worth recording that you correctly did not act on —
    pre-existing issues, a file growing too large, an abstraction that smells
    wrong, a contract that looked off. One bullet each, with `file:line`.
    Write `none` if there are none.

    **Blocker:** only when Status is `BLOCKED`. State exactly what stopped you,
    which file or contract is involved, and what you would need in order to
    proceed.
```

---

**Rules for the controller dispatching this:**

1. **One task per dispatch.** Never bundle two plan tasks into one implementer to save an agent — that reintroduces the serialization this step exists to remove. The single exception is the write-set collision handled in Step 2.1.
2. **`[ROLE]` comes from the plan, never from the file path.** Substituting a role you inferred yourself hides a planning bug the fallback would have surfaced.
3. **Paste, do not reference.** The implementer has no access to your context, the plan file, or earlier waves' reports. A prompt saying "implement Task 3 from the plan" fails.
4. **Contracts are mandatory for waves 2+.** A wave exists as a separate wave precisely because it consumes something an earlier wave produced. If you cannot name what this task consumes, the wave boundary was wrong.
5. **Never let an implementer commit.** Commits are wave-level and controller-owned (Step 2.4). Concurrent implementers committing would interleave into unreviewable history.
6. **Treat `DONE_WITH_CONCERNS` as done.** It does not block the wave. Route the concerns into Step 3's follow-ups collection.
7. **Treat `BLOCKED` as a wave stop.** Do not commit a partial wave; report which task and file blocked it.
