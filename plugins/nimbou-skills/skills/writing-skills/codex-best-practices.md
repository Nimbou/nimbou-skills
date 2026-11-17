# Codex skill authoring

## Discovery and invocation

Use a lowercase, hyphenated folder name and the same `name` in `SKILL.md`. Write the `description` as a brief statement of the capability and when it applies. Mention a nearby boundary if it prevents likely misrouting.

```yaml
---
name: release-draft
description: Draft release notes from local Git history for a requested version or commit range.
---
```

Use `$release-draft` to test explicit invocation in Codex. To test automatic selection, try a realistic request without naming the skill and a nearby request that belongs to a different workflow. Keep any existing `agents/openai.yaml` settings unless the user asks to change them.

## Structure the instructions

Keep the body focused on the outcome, scope, decisions, and verification. Define exact prerequisites and stopping conditions when they protect side effects or data. Offer criteria and examples when several approaches are valid.

Put long schemas, examples, and mode-specific details in linked references. Say when to open each file. Use scripts for repeated transformations or deterministic validation and document the inputs and output. Use assets for templates or resources needed in the deliverable.

A small skill can consist of a single file. Add supporting directories as required by the workflow.

```text
release-draft/
  SKILL.md
  references/
    release-format.md
```

Use conventional Markdown links to refer to skill resources. Name cross-skill dependencies by their registered skill name and explain when they apply. Use tool names that exist in the target Codex environment. For a workflow with a difficult branch, the bundled [Graphviz conventions](graphviz-conventions.dot) and [renderer](render-graphs.js) are available.

## Validate changes

Run the Skill Creator validator when available and verify referenced paths and changed scripts using their actual inputs. Check a matching request and a nearby request for routing changes. For workflow changes, verify a representative outcome and a boundary case, including what the run did and which side effects occurred.

For independent Codex validation, use the model defined in [writing-skills](SKILL.md) and the setup in [Testing skills with subagents](testing-skills-with-subagents.md).
