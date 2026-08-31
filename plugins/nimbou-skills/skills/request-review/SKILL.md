---
name: request-review
description: Use when completing tasks, implementing major features, or before merging to verify work meets requirements
---

# Request Review

Dispatch one general `spawn_agent` reviewer using `code-reviewer.md` to catch issues before they cascade. The reviewer gets precisely crafted context for evaluation — never your session's history. This keeps the reviewer focused on the work product, not your thought process, and preserves your own context for continued work.

**Core principle:** Review early, review often.

## When to Request Review

**Mandatory:**

- After each task in subagent-driven development
- After completing major feature
- Before merge to main

**Optional but valuable:**

- When stuck (fresh perspective)
- Before refactoring (baseline check)
- After fixing complex bug

## How to Request

**1. Get git SHAs:**

```bash
BASE_SHA=$(git rev-parse HEAD~1)  # or origin/main
HEAD_SHA=$(git rev-parse HEAD)
```

**2. Dispatch the reviewer:**

Use `spawn_agent` with a concise message built from `code-reviewer.md`. Include the base and head SHAs rather than pasting the full diff; the reviewer reads it locally. Do not dispatch this reviewer while a wave's implementers are still active.

**Placeholders:**

- `{WHAT_WAS_IMPLEMENTED}` - What you just built
- `{PLAN_OR_REQUIREMENTS}` - What it should do
- `{BASE_SHA}` - Starting commit
- `{HEAD_SHA}` - Ending commit
- `{DESCRIPTION}` - Brief summary

**3. Act on feedback:**

- Fix Critical issues immediately
- Fix Important issues before proceeding
- Note Minor issues for later
- Push back if reviewer is wrong (with reasoning)

## Guideline-Aware Review Focus

When the target project has a relevant local `GUIDELINES.md`, include its constraints in the review context instead of asking for a generic code-quality pass.

High-value checks to include when relevant:

- Frontend: ignored local primitive or wrapper, rebuilt shell locally, duplicated fetch ownership, store introduced for simple parent-child communication, missing loading/empty/error handling, local style drift from required tokens or preprocessors
- Backend: Prisma leaking outside infrastructure, repository doing orchestration or domain logic, chatty endpoint where a chunky/batch contract fits, per-id validation loops instead of batch lookup, full-form payloads sent to partial update endpoints, schema evolution without expand-migrate-contract thinking

If the work is scoped to one flow, route, or module, ask the reviewer to stay bounded to that slice instead of broad cleanup advice.

## Example

```
[Just completed Task 2: Add verification function]

You: Let me request code review before proceeding.

BASE_SHA=$(git log --oneline | grep "Task 1" | head -1 | awk '{print $1}')
HEAD_SHA=$(git rev-parse HEAD)

[Dispatch nimbou-skills:code-reviewer]
  WHAT_WAS_IMPLEMENTED: Verification and repair functions for conversation index
  PLAN_OR_REQUIREMENTS: Task 2 from docs/plans/deployment-plan.md
  BASE_SHA: a7981ec
  HEAD_SHA: 3df7661
  DESCRIPTION: Added verifyIndex() and repairIndex() with 4 issue types

[Subagent returns]:
  Strengths: Clean architecture, real tests
  Issues:
    Important: Missing progress indicators
    Minor: Magic number (100) for reporting interval
  Assessment: Ready to proceed

You: [Fix progress indicators]
[Continue to Task 3]
```

## Integration with Workflows

**Subagent-Driven Development:**

- Review after a completed, bounded batch
- Catch issues before the next dependent batch
- Fix before moving to dependent work

**Executing Plans:**

- Defer to `executing-plans`: it performs one spec review and one boundary review after all waves, not a review per batch

**Ad-Hoc Development:**

- Review before merge
- Review when stuck

## Red Flags

**Never:**

- Skip review because "it's simple"
- Ignore Critical issues
- Proceed with unfixed Important issues
- Argue with valid technical feedback

**If reviewer wrong:**

- Push back with technical reasoning
- Show code/tests that prove it works
- Request clarification

See template at: request-review/code-reviewer.md
