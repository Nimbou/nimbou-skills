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

Then open with one numbered textual questionnaire containing every independent doubt you can already shape, with no numerical cap. Defer only questions whose framing or options depend on an earlier answer. Give each question exactly three options (`A`, `B`, `C`), put the recommended option first, and finish with the compact answer format described in `SKILL.md`.

### 2. Identify the Type of Idea

Classify the idea internally before questioning it.

Examples: product, feature, business, content, marketing, process improvement, technical architecture, career, research, creative, operational.

Do not necessarily tell the user the classification unless it helps the conversation. Use it to choose better question shapes.

### 3. Explore the Problem

Before improving the solution, understand the problem. Use the textual questionnaire to narrow:

- What problem this idea solves
- Who has this problem
- How painful or frequent the problem is
- How people solve it today
- Why current solutions are insufficient
- What happens if the problem is not solved

Do not refine the idea deeply until the problem is clear.

### 4. Explore the User or Audience

Clarify who the idea is for. Typical question shapes:

- Primary audience (single-select among exactly 3 personas, with the recommended persona first)
- Context of use (single-select)
- Secondary audiences in scope (multi-select)
- Willingness to pay / adopt / change behavior (single-select with explicit trade-offs)

If the target audience is too broad, help narrow it.

### 5. Explore the Desired Outcome

Clarify what success means. Push the user to define success concretely. Where possible, surface measurable definitions as options:

- Main goal (e.g. "Validar demanda" / "Gerar receita" / "Aprender")
- What would make it fail
- Time horizon for the outcome

### 6. Surface Assumptions

Identify assumptions behind the idea. For each important assumption, ask whether there is evidence — typically as a single-select with exactly 3 options such as "Tenho evidência direta", "Tenho evidência indireta" and "Ainda não tenho evidência".

If there is no evidence, mark it as an assumption to validate.

### 7. Find Gaps and Contradictions

Look for unclear or conflicting parts. When a contradiction appears, pause and surface it directly — usually as a single-select question framing the trade-off the contradiction implies (e.g. "Esta tensão entre simplicidade prometida e setup complexo deve ser resolvida cortando setup, ajustando a promessa, ou aceitando a fricção?").

### 8. Explore Constraints

Clarify the limits around the idea. Constraints are an excellent fit for `multiSelect: true`:

- Tempo, orçamento, capacidade técnica, tamanho do time, restrições legais, posicionamento de marca, sistemas existentes, timing de mercado, disponibilidade pessoal, tolerância a risco.

Do not suggest solutions that ignore the user's constraints.

### 9. Explore Alternatives

Once the idea is reasonably clear, propose alternative framings as a textual question with exactly 3 options, placing the recommended framing first. For each option, include:

- What it is in one phrase
- Main trade-off
- When to choose it

Examples of option labels: "Versão menor", "Versão mais ambiciosa", "Versão de nicho", "Versão manual primeiro", "Versão automatizada", "Uso interno", "Público externo".

### 10. Stress-Test the Idea

Challenge the idea before refining it. Useful question shapes:

- "Qual é a objeção mais forte?" (single-select with exactly the 3 most plausible objections you can articulate)
- "O que precisa ser testado primeiro?" (single-select)
- "Qual é a menor versão útil?" (single-select)

Be direct and useful, not harsh.

### 11. Refine the Idea

After the main doubts are answered, help sharpen the idea. Refinement may include: clearer positioning, better target audience, narrower scope, stronger value proposition, simpler first version, better problem framing, better differentiation, better success criteria, better validation path.

When proposing a refinement, validate it with the user — typically a single-select between "Aceitar como proposto (Recomendado)", "Aceitar com ajuste", "Rejeitar".

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

If any answer is unclear, include it in the next textual questionnaire together with every other newly shapeable independent doubt. Do not finalize while important doubts remain.

## Question Style

Good (delivered in the numbered textual questionnaire):

> **1. Quem sente este problema mais fortemente?**
> - A. Iniciantes (Recomendado) — pouca familiaridade, alta fricção, alta disposição a pagar por simplicidade
> - B. Intermediários — já têm workaround manual, trocam por ganho marginal de tempo
> - C. Avançados — querem controle, rejeitam soluções opinionadas

Good (custom response kept within the three-option format):

> **2. Qual transformação o usuário deve sentir?**
> - A. Ganho de tempo (Recomendado) — benefício concreto e fácil de validar
> - B. Mais controle — valor percebido maior, mas mais difícil de medir
> - C. Outra transformação — escreva em uma frase

Bad:

> "Tell me everything about the idea."

Bad:

> "Ótima ideia, aqui está o plano final."

Bad (unstructured text where three comparable options were possible):

> "O foco é validar demanda, gerar receita ou aprender?"
> *(should be a numbered textual question with exactly 3 options, the recommended one first, and each option carrying its trade-off)*
