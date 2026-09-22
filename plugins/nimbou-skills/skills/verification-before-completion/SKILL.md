---
name: verification-before-completion
description: Use immediately before opening a pull request or merging changes into a target branch
---

# Verification Before Completion

## Overview

Opening a pull request or merging changes without verification creates avoidable risk.

**Core principle:** Evidence before release actions.

**Violating the letter of this rule is violating the spirit of this rule.**

## The Iron Law

```
NO PR OR MERGE WITHOUT FRESH VERIFICATION EVIDENCE
```

If you have not run the relevant verification for the current changes, do not open the PR or merge.

## The Gate Function

```
BEFORE opening a pull request or merging changes:

1. IDENTIFY: What commands cover the changes being proposed or merged?
2. RUN: Execute the FULL command (fresh, complete)
3. READ: Full output, check exit code, count failures
4. VERIFY: Does output support opening the PR or merging?
   - If NO: Report the actual status and do not proceed
   - If YES: Record the evidence in the PR or merge context
5. ONLY THEN: Open the PR or merge

Skip any step = an unverified release action
```

## Common Failures

| Claim | Requires | Not Sufficient |
|-------|----------|----------------|
| Tests pass | Test command output: 0 failures | Previous run, "should pass" |
| Linter clean | Linter output: 0 errors | Partial check, extrapolation |
| Build succeeds | Build command: exit 0 | Linter passing, logs look good |
| Bug fixed | Test original symptom: passes | Code changed, assumed fixed |
| Regression test works | Red-green cycle verified | Test passes once |
| Agent completed | VCS diff shows changes | Agent reports "success" |
| Requirements met | Line-by-line checklist | Tests passing |

## Red Flags - STOP

- About to open a PR or merge without verification
- Trusting agent success reports
- Relying on partial verification
- Thinking "just this once"
- Tired and wanting work over

## Rationalization Prevention

| Excuse | Reality |
|--------|---------|
| "Should work now" | RUN the verification |
| "I'm confident" | Confidence ≠ evidence |
| "Just this once" | No exceptions |
| "Linter passed" | Linter ≠ compiler |
| "Agent said success" | Verify independently |
| "I'm tired" | Exhaustion ≠ excuse |
| "Partial check is enough" | Partial proves nothing |
| "Different words so rule doesn't apply" | Spirit over letter |

## Key Patterns

**Tests:**
```
✅ [Run test command] [See: 34/34 pass] "All tests pass"
❌ "Should pass now" / "Looks correct"
```

**Regression tests (TDD Red-Green):**
```
✅ Write → Run (pass) → Revert fix → Run (MUST FAIL) → Restore → Run (pass)
❌ "I've written a regression test" (without red-green verification)
```

**Build:**
```
✅ [Run build] [See: exit 0] "Build passes"
❌ "Linter passed" (linter doesn't check compilation)
```

**Requirements:**
```
✅ Re-read plan → Create checklist → Verify each → Report gaps or completion
❌ "Tests pass, phase complete"
```

**Agent delegation:**
```
✅ Agent reports success → Check VCS diff → Verify changes → Report actual state
❌ Trust agent report
```

## Why This Matters

From 24 failure memories:
- your human partner said "I don't believe you" - trust broken
- Undefined functions shipped - would crash
- Missing requirements shipped - incomplete features
- Time wasted on false completion → redirect → rework
- Violates: "Honesty is a core value. If you lie, you'll be replaced."

## When To Apply

**Use only before:**
- Opening a pull request
- Merging changes into a target branch

It does not gate ordinary progress updates, commits, task transitions, or delegation.

## The Bottom Line

**No shortcuts for verification.**

Run the relevant commands. Read the output. THEN open the PR or merge.

This is non-negotiable.
