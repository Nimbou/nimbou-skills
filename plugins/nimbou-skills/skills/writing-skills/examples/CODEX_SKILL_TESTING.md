# Validate a Codex release-draft skill

Prepare a local Git fixture with a release tag and two subsequent commits. Include a second fixture with no tag, so the skill has to handle the missing range.

## Selection

- Ask “Prepare draft release notes from the last tag to HEAD.” Expect the release-draft skill to apply.
- Ask “List the two newest commits.” Expect ordinary Git inspection.
- Ask “Publish the release now.” Expect routing to the publishing workflow if available.

Run the first request with `$release-draft` as a separate explicit-invocation check.

## Behavior

Run the same draft request first with the baseline and then with the candidate in a fresh context. Read [Testing skills with subagents](../testing-skills-with-subagents.md) for the model and setup.

- The output names the range used and reflects both commits.
- An empty range or a repository without tags is handled according to the skill’s stated behavior.
- The repository has the same branch, refs, and working-tree status before and after.
- Tool actions stay within the task’s read-only scope.
