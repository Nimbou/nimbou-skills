---
name: writing-skills
description: Create, update, or validate Codex skills, including their discovery descriptions, reusable instructions, and supporting files.
---

# Writing Codex Skills

Capture reusable workflows, decision criteria, and project context that Codex needs to do the task well. Put repository-wide instructions in its `AGENTS.md`. Use the user’s target directory or the repository’s existing skill layout.

## Write or update the skill

1. Read the current skill and its callers. Identify what should trigger it, what Codex should produce, and which decisions or constraints the skill must clarify. Preserve the requested scope, invocation policy, and existing workflow behavior outside the change.
2. For a behavioral change, write a realistic case with an observable expected outcome. Establish a baseline with the current revision for an edit or a run without the skill for new behavior. Record how the baseline handles the case. For documentation and packaging changes, check the affected instructions, metadata, and links.
3. Make the smallest change that addresses the case. Put discovery information in the description, essential workflow in the body, and conditional detail in linked references. See [Codex skill authoring](codex-best-practices.md) for structure, examples, and tool references.
4. Validate the skill and all changed resources. Rerun the behavioral case when applicable. Verify that the description routes matching requests to the skill and leaves nearby tasks to their own workflows.

## Validate with Codex

Use `gpt-6.2-sol` with `high` reasoning for independent Codex validation runs under this skill. This is the exception for `writing-skills` in the library model policy.

When independent validation is authorized and useful, run the same scenario in fresh contexts and compare the observable outcomes. Follow [Testing skills with subagents](testing-skills-with-subagents.md) for the setup and evaluation. For focused edits, use a targeted check in the current chat. A skill file provides instructions to the current chat, and the selected model is configured when a run starts.

Keep commits, pushes, installation, and publication within the user's requested scope.
