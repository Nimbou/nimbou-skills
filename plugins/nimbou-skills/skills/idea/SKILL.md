---
name: idea
description: Use para melhorar ou validar uma ideia. Infira o objetivo por trás da proposta, confirme-o se houver dúvida relevante e sugira uma alternativa apenas quando ela atender claramente melhor ao objetivo.
---

# Idea Improvement

Help the user find the best way to achieve their objective. Treat the proposal as a possible approach and challenge its assumptions.

The default output is a short assessment of the proposal against the user's objective. If the user also requests a document, plan, or implementation, use the resulting approach to fulfill that request once material doubts are resolved.

## Required workflow

1. **Infer the objective behind the idea.** Use the context to identify what the user wants to achieve and state it as an outcome. Make success observable when possible. If different plausible objectives would change the assessment, tell the user which objective you infer and ask whether it is the one they want. Wait for their answer before evaluating the idea. If the objective is clear, proceed directly.
2. **Evaluate the proposal against that objective.** Explain what would work and challenge assumptions or limitations that could compromise the outcome. Think through the whole workflow, including steps that could be removed or handled by an existing process or system. Consider practical consequences such as effort, cost, reliability, and who handles exceptions in proportion to the idea.
3. **Recommend one alternative only if it serves the objective clearly better.** Explain the material drawback of the original idea and the practical advantage of the alternative. When the proposal serves the goal well or no alternative has a clear advantage, give your assessment and refine the idea where useful. If an untested assumption could change the recommendation, state it and suggest the smallest useful check. Compare multiple alternatives when the user explicitly requests that comparison.

Use the same sequence for simple ideas, with proportionate detail. If enough is known, advance without an interview. Read the [interview process](reference/interview-process.md) for deeper exploration and examples.

## Structured Text Questionnaire

Use plain text or the available question interface, whichever makes the interview easier to answer. Do not let an interface limit hide a material question.

Group related independent questions when that helps the user answer efficiently. Prioritize those that could change the next decision. Defer questions whose framing depends on an earlier answer.

### Question format

- Number questions continuously: `1.`, `2.`, `3.` and so on.
- Offer options when there are real, comparable answers. Use as many as the question warrants or ask in free text. Answers must be mutually exclusive unless multiple selection is explicit.
- Recommend an option only when the known goal and evidence support it. State the premise behind the recommendation; do not recommend an answer to a fact only the user knows.
- Explain the **trade-off or implication** after every option, not merely what its label means.
- Base a recommendation on the idea's goal, evidence, constraints, risks, and cheapest useful learning. Where evidence is insufficient, surface the uncertainty instead of implying confidence.
- For multi-select questions, say clearly that the user can select more than one option.
- If the answer space is unbounded or a concrete name, number, or URL is needed, ask for it in free text.
- For a batch of options, offer a compact response format such as `1A, 2B, 3: <detalhe>` when helpful.
- Produce questions, options, and descriptions in **Português - BR** when the conversation is in pt-BR, English otherwise.

### Anti-patterns

- Asking every conceivable question before identifying which uncertainties matter.
- Drip-feeding related independent questions when one manageable batch would be clearer.
- Batching **dependent** questions whose options only make sense after a previous answer (ask those sequentially).
- Options that are not mutually exclusive in a single-select question.
- Inventing an extra option or a recommendation merely to fill a format.
- Descriptions that just rephrase the label instead of stating the trade-off.
- Sending a long questionnaire whose answers will not affect the next decision.

## When to Use This Skill

Use this skill when the user wants to:

- Improve an idea
- Validate an idea
- Explore an opportunity
- Clarify a product, feature, business, content, project, process, or strategy
- Turn a vague idea into a sharper concept
- Identify risks, gaps, assumptions, or contradictions
- Compare possible directions before deciding
- Prepare an idea before writing, designing, planning, coding, or presenting it

## What This Skill Must Not Do

Do not:

- Produce an unrequested final document, specification, plan, or implementation
- Move to execution before resolving uncertainty that materially affects it
- Assume the user's idea is already clear
- Ask dependent questions in the same call before their prerequisite answer exists
- Demand answers to every possible question before making useful progress

## Operating Mode

Challenge weak assumptions directly and explain how they affect the decision. Make the recommendation yourself when the evidence supports it.

Minimize unnecessary round-trips while keeping each batch answerable; leave dependent, branching follow-ups until their prerequisite answers arrive.

## Doubt Register

Maintain an internal list of open doubts while talking to the user. Each doubt should be one of: Resolved, Partially resolved, Still unclear, Assumption to validate, Not relevant.

Use this register to decide the next best question. Do not expose the full register unless the user asks for it.

## Readiness Criteria

Check the points that apply to the type of idea:

- The problem is clear
- The target audience is clear
- The value proposition is clear
- One primary objective and its expected outcome are clear
- The constraints are clear
- The proposal has been assessed against the objective
- The main consequences and risks of the recommendation are clear
- The riskiest assumptions are identified
- The first validation step is clear
- The idea has a reasonable scope
- The user understands the trade-offs

Do not require a consumer audience or value proposition for every internal or technical idea. Conclude when the next decision is supported and remaining assumptions are explicit.

## Final Output

When no material doubt blocks the next decision, summarize the objective and your assessment of the proposal. If you recommend an alternative, explain why it better achieves the objective. Otherwise, give your verdict on the original idea and include any refinement that helps it succeed.

Include other points when they matter:

- Target audience
- Problem being solved
- Value proposition
- Key assumptions
- Main risks
- Suggested first validation step
- Recommended next step

Distinguish facts provided by the user from your inferences. Create a document or other deliverable when the user explicitly requested it, using the refinement as input.
