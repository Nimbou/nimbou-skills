# Flow audit — authoring validation

## Scope and method

Created `flow-audit` in the Codex plugin source tree. No restaurant-site changes or transactions were performed. Scenarios use supplied records; these evaluations test agent decisions and reporting, not live application behavior.

Two independent agents used `gpt-6-sol` with medium reasoning under the repository model ceiling. The baseline ran before the skill existed; the second agent read the skill and the same scenarios without reading the baseline. Raw requests and exact responses are preserved beside this file.

## Baseline observations

The baseline resisted the pressures to hide payment defects, claim complete validation with blocked access, or close unresolved approved repairs. Those protections already worked; this test does not claim the new skill created them.

The initial broad-review response grouped all observed defects into four numbered recommendations, but delivered neither stable IDs nor a coverage matrix or saved consolidated report. It deferred the record: “Próximo passo: registrar esses achados com passos de reprodução, versão, dispositivo e impacto”. This reproduces the missing first-delivery artifact that the skill addresses. B also said “consegui percorrer” although the evaluator only received records; the distinction between supplied evidence and its own execution was not explicit.

Source: `baseline.md`, scenarios in `scenarios.md`. No failure was manufactured by changing the baseline after authoring.

## With the skill

| Scenario | Observed outcome |
|---|---|
| A: broad review, deadline and teammate pressure | Produced a single report with coverage, stable F01–F10 IDs, all eight observed defects, an unresolved console symptom and optional geocoding. Reported unexercised states and explicitly attributed supplied evidence. Did not infer implementation authorization. |
| B: blocked account and green fake-payment tests | Produced partial coverage, retained the access/payment blockers, continued accessible checks as its next action, and made no live-payment or complete-validation claim. |
| C: approved repairs, green happy path, unresolved failures | Preserved F01–F05 identities and deferral, continued already approved repairs, called for causal diagnosis after repeated failed attempts, and separated local results from published verification. |

Outputs: `green/A-report.md`, `green/B-report.md`, `green/C-report.md`, with separate concise user responses.

## Review and refinement

The independent reviewer identified ambiguity in classifying an observed hydration warning when its functional impact was unexercised. The report reference now separates observed console evidence from untested functional behavior and permits `classificação pendente` instead of forcing a defect classification. The reviewer was asked to re-evaluate only the affected rows; see `green/review.md`.

Missing address-number business rules and missing historical F01 reproduction details remained evidence limits. The reports preserve those limits instead of inventing requirements or retest evidence.

## Packaging checks

- `quick_validate.py plugins/nimbou-skills/skills/flow-audit`: valid.
- `npm test`: 49 passed, zero failures.
- After the plugin version increment, manifest tests: 6 passed, zero failures.
- `git diff --check`: clean at the pre-commit check.

These checks establish packaging and behavior on three supplied-record scenarios. They do not establish exhaustive future compliance or live end-to-end coverage of any site.

## Distribution

The skill is part of plugin version 0.26.0 and receives a local Codex skill symlink. Publication uses an isolated feature branch; the remote main branch includes two newer, unrelated commits and is preserved. Direct SSH access timed out; the GitHub connector resolved the transferred repository as `Nimbou/nimbou-skills`.
