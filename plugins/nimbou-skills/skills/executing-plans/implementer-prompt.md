# Implementer Subagent Prompt Template

Use this template when the controller fans a wave's tasks out under `nimbou-skills:executing-plans` (Step 2.2). **One dispatch per group from Step 2.1b**, launched with `spawn_agent` in capacity-bounded batches. A group is usually one task; it holds more when the tasks share an owner.

**Purpose:** Implement the task — or the two or three same-owner tasks — the controller assigned, each inside its declared file boundary, each driven by its own failing test, proving both the red run and the green one.

**Precondition:** the controller already checked write sets (Step 2.1) and coalesced by Role (Step 2.1b). Every implementer in a wave owns a disjoint set of files. Tasks reaching this template together either share a file or share a Role — the controller resolved which before dispatching.

**Role brief:** `[ROLE]` — the slug the plan declared for this task (`**Role:**` line in `nestjs-plan`, `Role` column in `nuxt-plan`). The controller reads the matching brief in `./codex-role-briefs.md` and includes it in this message. When the plan declared none, `[ROLE]` is `general-purpose` and the controller says so in the wave report.

**Isolation:** the implementer never inherits the controller's session history — nor, reliably, its working directory. Everything it needs is constructed below, including the absolute path of the checkout it writes to.

```
spawn_agent:
  task_name: "onda-n-task-m"
  message: |
    You are implementing exactly one task from an approved implementation plan.
    Other implementers are working on other tasks of the same wave, in parallel,
    in this same checkout. Stay inside your file boundary.

    ## Where You Work

        WORKTREE_ROOT = [absolute path from `git rev-parse --show-toplevel` in the
                         checkout the controller is executing this plan in]

    This run may be happening in a git worktree rather than the project's main
    checkout. Before your first write, run `git rev-parse --show-toplevel`. If it
    does not print WORKTREE_ROOT exactly, build every path as
    `WORKTREE_ROOT + '/' + <path relative to the repo>` — do not rely on your
    working directory.

    Paths in the plan are repo-relative even when the plan wrote them as absolute.
    An absolute path in the plan that does not start with WORKTREE_ROOT belongs to
    a different checkout: strip its prefix and re-anchor it under WORKTREE_ROOT.
    Writing to it as written puts your work in a checkout this run will never
    commit, and the wave lands half-finished.

    Report every path relative to WORKTREE_ROOT.

    ## Role Brief

    [The compact brief for [ROLE], read from `codex-role-briefs.md`.]

    ## Your Task

    Read `<plan path>` at lines `<task start>-<task end>`. If the first line is not
    this task's heading, search that plan for the heading and read the corrected range.
    If the task still cannot be found, report a blocker rather than implement a guess.

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

    **Red run:** command, exit code, relevant assertion/error excerpt, and one line
    on why it proves the test was real. Limit the excerpt to **at most 20 lines or
    1,500 characters**. If you implemented before running red, say so plainly;
    an honest report is recoverable, a fabricated one is not.

    **Verification:** command, exit code, and relevant summary/failure excerpt,
    again at most 20 lines or 1,500 characters. If the runner is chatty, redirect
    its full output to a temporary log and quote only the tail.

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

0. **Anchor every dispatch.** Resolve `WORKTREE_ROOT` once, before the wave, and paste the same absolute path into every implementer, the commit step, and the reviewers. A subagent does not reliably inherit your working directory, and the plan's paths mean nothing without a root. An implementer that writes into the main checkout while you commit from a worktree produces a wave that commits green and is missing half its files.
1. **Bundle only what shares an owner, up to three.** Two plan tasks ride one implementer when Step 2.1 found them writing the same file, or when Step 2.1b found them declaring the same `Role`. Nothing else. Bundling across Roles hands one agent two sets of boundary rules and loses the specialized routing; bundling past three collapses a heavy Role into one sequential lane the whole wave then waits on.
   - **A bundle is not a merged task.** Give each task its own spec range, its own `Files`, its own `RED`, its own `Verificação`, and require them done one at a time in order. List the files per task — a union invites task A's file to change while task B is being written, which lands an edit the commit message never mentions.
2. **`[ROLE]` comes from the plan, never from the file path.** Use its exact brief from `codex-role-briefs.md`; substituting a role you inferred yourself hides a planning bug the fallback would have surfaced.
3. **Pass an exact range, not copied prose.** Give the plan path, task heading, and line range. The worker reads that bounded range; a prompt saying only "implement Task 3" still fails.
4. **Contracts are mandatory for waves 2+.** A wave exists as a separate wave precisely because it consumes something an earlier wave produced. If you cannot name what this task consumes, the wave boundary was wrong.
5. **Never let an implementer commit.** Commits are wave-level and controller-owned (Step 2.4). Concurrent implementers committing would interleave into unreviewable history.
6. **Treat `DONE_WITH_CONCERNS` as done.** It does not block the wave. Route the concerns into Step 3's follow-ups collection.
7. **Treat `BLOCKED` as a wave stop.** Do not commit a partial wave; report which task and file blocked it.
