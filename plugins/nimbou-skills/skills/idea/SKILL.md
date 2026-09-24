---
name: idea
description: Use para esclarecer, desafiar e refinar uma ideia antes de decidir seu próximo passo.
---

# Idea Refinement

Help the user improve an idea through deep questioning, clarification, challenge, and structured refinement.

Its default output is a refined understanding of the idea. If the user also requests a document, plan, or implementation, refine what is necessary and then fulfill that explicit request.

Before drawing conclusions or executing a requested next step, expose assumptions, identify weak points, and resolve uncertainty that could materially change the work. If enough is already known, proceed without an artificial interview.

## Core Rule

Ask about doubts that could change the framing, validation, or next decision. Stop when remaining uncertainty can be stated as an assumption to validate without blocking useful progress.

Do not stop questioning just because the idea seems simple. Simple ideas often hide unclear assumptions, missing constraints, weak positioning, or undefined success criteria.

## Primary Mechanism: Structured Text Questionnaire

Use plain text or the available question interface, whichever makes the interview easier to answer. Do not let an interface limit hide a material question.

Group related independent questions when that helps the user answer efficiently. Prioritize those that could change the next decision. Defer questions whose framing depends on an earlier answer.

### Question format

- Number questions continuously: `1.`, `2.`, `3.` and so on.
- Offer options when there are real, comparable paths. Three options labeled `A`, `B`, and `C` are useful when they fit; use fewer or a free-text question when they do not. Options must be mutually exclusive unless multiple selection is explicit.
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

The default output is a refined understanding of the idea. An explicit request for another deliverable takes precedence.

## Operating Mode

Work as a critical but helpful thinking partner.

Your role is to improve the idea, not merely agree with it. Be supportive, but challenge weak assumptions. Point out ambiguity, risks, contradictions, and missing information.

Minimize unnecessary round-trips while keeping each batch answerable; leave dependent, branching follow-ups until their prerequisite answers arrive.

## Process

O ciclo completo — restate the idea, mapear o desconhecido, interrogar, estressar, convergir — e o estilo de pergunta esperado (com exemplos de boas e más perguntas) estão em `reference/interview-process.md`.

Consulte essa referência quando a ideia exigir exploração mais profunda. O Doubt Register abaixo acompanha o processo.

## Doubt Register

Maintain an internal list of open doubts while talking to the user. Each doubt should be one of: Resolved, Partially resolved, Still unclear, Assumption to validate, Not relevant.

Use this register to decide the next best question. Do not expose the full register unless the user asks for it.

## Readiness Criteria

Check the points that apply to the type of idea:

- The problem is clear
- The target audience is clear
- The value proposition is clear
- The expected outcome is clear
- The constraints are clear
- The main risks are clear
- The riskiest assumptions are identified
- The first validation step is clear
- The idea has a reasonable scope
- The user understands the trade-offs

Do not require a consumer audience or value proposition for every internal or technical idea. Conclude when the next decision is supported and remaining assumptions are explicit.

## Final Output

When no material doubt blocks the next decision, summarize the refined idea in plain text.

Include the applicable points in the final response:

- Refined idea
- Target audience
- Problem being solved
- Value proposition
- Key assumptions
- Main risks
- Suggested first validation step
- Recommended next step

Distinguish facts provided by the user from your inferences. Create a document or other deliverable when the user explicitly requested it, using the refinement as input.

## Key Principles

- Ask before solving
- Ask material independent questions in manageable batches; ask dependent ones after their prerequisite answer
- Use options and recommendations where they clarify real choices
- Each option carries its trade-off in the description, not just a restatement of the label
- Challenge assumptions respectfully
- Prefer clarity over speed
- Narrow vague ideas
- Make trade-offs explicit
- Avoid premature execution
- Keep refining until the idea is strong
- Stop when remaining uncertainty can be recorded without blocking the next useful step
- The goal is better thinking, not faster output
