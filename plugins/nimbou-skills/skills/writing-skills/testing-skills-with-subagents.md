# Testing Codex skills with subagents

Use this procedure when a workflow change needs independent behavioral evidence and the user has authorized delegation. The [writing-skills](SKILL.md) model policy selects the model and reasoning effort for both runs.

## Define the case

Write a realistic task with a checkable outcome. State the available files and tools, workspace boundaries, and side effects allowed by the request. Include a case that exercises a meaningful decision or failure mode. For selection changes, also try a nearby task that should route elsewhere.

## Compare the baseline and candidate

1. Run the baseline against the current skill for an edit. For a new skill, run the task without it.
2. Run the same request with the candidate skill in a fresh context. Keep the model, reasoning effort, fixture, tools, permissions, and prompt consistent. Change only which version of the skill is available.
3. Compare tool actions and artifacts to the expected outcome. Record the observed failure or improvement, adjust the instructions that caused it, and rerun the affected case.

For independent prompts sent through `spawn_agent`, pass these options along with the task name and a self-contained brief.

```json
{
  "model": "gpt-6.2-sol",
  "reasoning_effort": "high",
  "fork_turns": "none"
}
```

Give the evaluator the task, its authorized scope, and the inputs. Keep earlier conclusions and expected evaluator choices out of the brief. Use a read-only checkout for analysis or disposable fixtures for tasks that write files. Record the actual configuration and any test that the environment prevented.

See the [worked example](examples/CODEX_SKILL_TESTING.md) for selection checks and observable pass criteria.
