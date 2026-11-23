---
name: idea
description: Use para melhorar ou validar uma ideia. Defina o objetivo principal, compare três caminhos antes de refinar, avalie suas consequências e recomende a melhor opção, refutando a proposta inicial quando necessário.
---

# Idea Improvement

Help the user find the best way to achieve their objective. Treat the proposal as a possible approach and challenge its assumptions.

The default output is a recommended approach with its rationale and consequences. If the user also requests a document, plan, or implementation, complete the comparison and refine the chosen approach before fulfilling that request.

## Required workflow

1. **Define one primary objective per idea.** State the intended outcome independently of the proposed solution. Define an observable success criterion when possible. If you infer the objective, flag that assumption. Ask only about uncertainties that could materially change the objective, feasible options, or recommendation.
2. **Present exactly three distinct options before refining any of them.** Pick the strongest paths to the same objective. Include the original proposal when it is viable or useful as a baseline. Look at the whole workflow for steps that can be removed, consolidated, or handled by an existing process or system. Consider automation when it can improve the outcome or reduce total work. Evaluate AI when it can solve a specific limitation of simpler methods.
3. **Assess the consequences of each option and recommend the best fit.** Show how well each option serves the objective, its main trade-off, and what changes in practice. Compare implementation and ongoing effort, cost, reliability, and downstream effects. Consider what can fail, who handles it, and how they recover. Challenge the original premise directly when it fails. If the evidence favors replacing the proposal, say so and explain why the alternative is better. If an untested assumption could change the ranking, state it and suggest the smallest check that would help decide.
4. **Refine the selected approach.** Present the comparison and recommendation first. Proceed when the evidence supports a decision. When the choice depends on an unresolved constraint or a trade-off the user needs to make, keep the recommendation provisional and ask about that decision.

Use the same sequence for simple ideas, with proportionate detail. If enough is known, advance without an interview. Read the [interview process](reference/interview-process.md) for deeper exploration and examples.

## Structured Text Questionnaire

Use plain text or the available question interface, whichever makes the interview easier to answer. Do not let an interface limit hide a material question.

Group related independent questions when that helps the user answer efficiently. Prioritize those that could change the next decision. Defer questions whose framing depends on an earlier answer.

### Question format

- Number questions continuously: `1.`, `2.`, `3.` and so on.
- Offer options when there are real, comparable answers. Use as many as the question warrants or ask in free text. The three-option requirement applies to solution paths. Answers must be mutually exclusive unless multiple selection is explicit.
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
- Three distinct options have been compared against the objective
- The main consequences and risks of each option are clear
- The riskiest assumptions are identified
- The first validation step is clear
- The idea has a reasonable scope
- The user understands the trade-offs

Do not require a consumer audience or value proposition for every internal or technical idea. Conclude when the next decision is supported and remaining assumptions are explicit.

## Final Output

When no material doubt blocks the next decision, summarize the objective, the three options and their consequences, the recommended approach and why it wins, and the resulting idea.

Include other points when they matter:

- Target audience
- Problem being solved
- Value proposition
- Key assumptions
- Main risks
- Suggested first validation step
- Recommended next step

Distinguish facts provided by the user from your inferences. Create a document or other deliverable when the user explicitly requested it, using the refinement as input.
