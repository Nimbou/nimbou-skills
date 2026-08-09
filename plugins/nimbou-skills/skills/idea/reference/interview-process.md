# idea — processo da entrevista

Referência de consulta de `idea`. Leia antes da primeira pergunta e mantenha aberta durante o ciclo.

## Process

### 1. Restate the Idea

Begin by briefly restating what you understood. Free-text is appropriate here — no question yet.

Your restatement should include:

- The core idea
- The apparent goal
- The target user or audience, if known
- The expected outcome, if known
- Any assumptions you are already making

Then open with the first clarifying round via `AskUserQuestion` — batch the independent doubts you already have (up to 4) into that single call.

### 2. Identify the Type of Idea

Classify the idea internally before questioning it.

Examples: product, feature, business, content, marketing, process improvement, technical architecture, career, research, creative, operational.

Do not necessarily tell the user the classification unless it helps the conversation. Use it to choose better question shapes.

### 3. Explore the Problem

Before improving the solution, understand the problem. Use `AskUserQuestion` to narrow:

- What problem this idea solves
- Who has this problem
- How painful or frequent the problem is
- How people solve it today
- Why current solutions are insufficient
- What happens if the problem is not solved

Do not refine the idea deeply until the problem is clear.

### 4. Explore the User or Audience

Clarify who the idea is for. Typical AskUserQuestion shapes:

- Primary audience (single-select among 2-4 personas)
- Context of use (single-select)
- Secondary audiences in scope (multi-select)
- Willingness to pay / adopt / change behavior (single-select with explicit trade-offs)

If the target audience is too broad, help narrow it.

### 5. Explore the Desired Outcome

Clarify what success means. Push the user to define success concretely. Where possible, surface measurable definitions as options:

- Main goal (e.g. "Validar demanda" / "Gerar receita" / "Reduzir custo operacional" / "Aprender")
- What would make it fail
- Time horizon for the outcome

### 6. Surface Assumptions

Identify assumptions behind the idea. For each important assumption, ask whether there is evidence — typically as a single-select with options like "Tenho evidência direta", "Tenho evidência indireta", "É uma intuição", "Nunca pensei nisso".

If there is no evidence, mark it as an assumption to validate.

### 7. Find Gaps and Contradictions

Look for unclear or conflicting parts. When a contradiction appears, pause and surface it directly — usually as a single-select question framing the trade-off the contradiction implies (e.g. "Esta tensão entre simplicidade prometida e setup complexo deve ser resolvida cortando setup, ajustando a promessa, ou aceitando a fricção?").

### 8. Explore Constraints

Clarify the limits around the idea. Constraints are an excellent fit for `multiSelect: true`:

- Tempo, orçamento, capacidade técnica, tamanho do time, restrições legais, posicionamento de marca, sistemas existentes, timing de mercado, disponibilidade pessoal, tolerância a risco.

Do not suggest solutions that ignore the user's constraints.

### 9. Explore Alternatives

Once the idea is reasonably clear, propose alternative framings via a single AskUserQuestion with 2-4 options. For each option, the `description` should include:

- What it is in one phrase
- Main trade-off
- When to choose it

Examples of option labels: "Versão menor", "Versão mais ambiciosa", "Versão de nicho", "Versão manual primeiro", "Versão automatizada", "Uso interno", "Público externo".

### 10. Stress-Test the Idea

Challenge the idea before refining it. Useful question shapes:

- "Qual é a objeção mais forte?" (single-select with the 3-4 most plausible objections you can articulate, plus Other)
- "O que precisa ser testado primeiro?" (single-select)
- "Qual é a menor versão útil?" (single-select)

Be direct and useful, not harsh.

### 11. Refine the Idea

After the main doubts are answered, help sharpen the idea. Refinement may include: clearer positioning, better target audience, narrower scope, stronger value proposition, simpler first version, better problem framing, better differentiation, better success criteria, better validation path.

When proposing a refinement, validate it with the user — typically a single-select between "Aceitar como proposto", "Aceitar com ajuste", "Rejeitar".

### 12. Check for Remaining Doubts

Before ending, perform an internal uncertainty check:

- Do I understand the problem?
- Do I understand who this is for?
- Do I understand why it matters?
- Do I understand the expected result?
- Do I understand the constraints?
- Do I understand the main risks?
- Do I understand the assumptions?
- Do I understand what should be tested first?
- Do I understand what the idea is not?

If any answer is unclear, ask another AskUserQuestion. Do not finalize while important doubts remain.

## Question Style

Good (delivered as `AskUserQuestion`):

> **Quem sente este problema mais fortemente?**
> - Iniciantes — pouca familiaridade, alta fricção, alta disposição a pagar por simplicidade
> - Intermediários — já têm workaround manual, trocam por ganho marginal de tempo
> - Avançados — querem controle, rejeitam soluções opinionadas

Good (free-text, only when option space is unbounded):

> "Em uma frase, qual é a transformação que o usuário sente depois de usar isso?"

Bad:

> "Tell me everything about the idea."

Bad:

> "Aqui está um formulário com 20 perguntas. Responde tudo."

Bad:

> "Ótima ideia, aqui está o plano final."

Bad (free-text where AskUserQuestion was obviously better):

> "O foco é validar demanda, gerar receita, reduzir custo, ou aprender?"
> *(should be a single-select AskUserQuestion with each option carrying its trade-off in the description)*
