# idea — processo da entrevista

Referência para ideias que exigem exploração mais profunda. Use as etapas de investigação conforme a necessidade. Siga o fluxo do [SKILL.md](../SKILL.md) para inferir o objetivo, avaliar a ideia e sugerir uma alternativa quando ela atender claramente melhor ao objetivo.

## Process

### 1. Restate the Idea

Begin by briefly restating what you understood. Free-text is appropriate here — no question yet.

Your restatement should include:

- The core idea
- The primary objective, stated as an outcome
- The target user or audience, if known
- The expected outcome, if known
- Any assumptions you are already making

If the objective is uncertain and the answer would change your assessment, state the most likely objective and ask the user to confirm or correct it before assessing the idea. Once the objective is clear, group any remaining independent questions that could change the next decision. Defer questions whose framing depends on an earlier answer.

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

- Primary audience, when the idea has one
- Context of use (single-select)
- Secondary audiences in scope, when relevant
- Willingness to pay, adopt, or change behavior, when relevant

If the target audience is too broad, help narrow it.

### 5. Define the Primary Objective

State one primary objective per idea and make success observable. Identify which other desired outcomes are constraints or secondary benefits. When goals compete and the priority changes the recommendation, ask the user to choose the main goal.

Clarify the success criterion, what would count as failure, and the time horizon when it affects the choice.

### 6. Surface Assumptions

Identify assumptions behind the idea. For each assumption that could change the direction, establish whether there is direct evidence, indirect evidence, or no evidence yet. Ask openly when the answer cannot be represented honestly by predefined choices.

If there is no evidence, mark it as an assumption to validate.

### 7. Find Gaps and Contradictions

Look for unclear or conflicting parts. When a contradiction appears, surface it directly and ask which trade-off the user accepts (e.g. "Esta tensão entre simplicidade prometida e setup complexo deve ser resolvida cortando setup, ajustando a promessa, ou aceitando a fricção?").

### 8. Explore Constraints

Clarify the limits around the idea. Let the user name more than one constraint when appropriate:

- Tempo, orçamento, capacidade técnica, tamanho do time, restrições legais, posicionamento de marca, sistemas existentes, timing de mercado, disponibilidade pessoal, tolerância a risco.

Do not suggest solutions that ignore the user's constraints.

### 9. Evaluate the Proposal Against the Objective

Trace how the work would get done from start to finish. Look for steps that can be removed, combined, or handled by a system already in use. Consider rules and existing capabilities, and identify any specific gap that automation or AI might close. Count the work shifted to other people or systems, including review, exceptions, and maintenance.

Assess the original proposal on the factors that could change the decision, such as time, recurring work, cost, accuracy, and effects on downstream users or workflows. Consider other ways to achieve the same objective and surface only the strongest one if its advantage is material under the user's constraints.

### 10. Stress-Test the Recommendation

Examine the most consequential assumption and failure mode in the proposal and, when you recommend an alternative, check them for that approach too. Consider how a failure would be detected, who would handle it, and how it could be corrected. Useful questions:

- "Se essa etapa falhar, quem percebe e como corrige?"
- "A mudança elimina trabalho ou desloca o esforço para outra pessoa?"
- "Que resultado de um teste pequeno mudaria a recomendação?"

Explain what would make the proposal succeed or fail. If you found a clearly better approach, explain what it improves and what could change your recommendation. If no clear advantage emerged, focus the assessment on the user's proposal.

### 11. Refine the Selected Approach

Refine the recommended approach when doing so adds value. Focus on what would make it work, such as a narrower scope, a simpler first version, clearer success criteria, or a better validation path.

Confirm with the user when a refinement would change their objective.

### 12. Check for Remaining Doubts

Before ending, perform an internal uncertainty check:

- Do I understand the problem?
- Do I understand who this is for?
- Do I understand why it matters?
- Is there one primary objective for each idea, with an observable outcome where possible?
- Do I understand the constraints?
- Did I evaluate the proposal and its main consequences against the objective?
- If I recommend an alternative, can I explain its advantage for that objective?
- Do I understand the assumptions?
- Do I understand what should be tested first?

If an unanswered doubt blocks the next decision, ask about it. Otherwise, record it as an assumption to validate and conclude.

## Exemplos

**Objetivo a confirmar.** O usuário diz “Quero mandar um lembrete diário no canal da equipe”. Pergunte “Pelo que entendi, seu objetivo é reduzir os atrasos nas entregas. É isso que você quer resolver?” Aguarde a confirmação para avaliar o lembrete.

**Ideia adequada.** O usuário recebe dois PDFs por mês e quer dividir cada um manualmente para vincular os documentos aos registros certos. A divisão manual é proporcional ao volume. Uma conferência dos vínculos antes de concluir atende ao objetivo de evitar anexos incorretos.

**Alternativa claramente melhor.** O usuário quer reduzir o tempo de anexação e propõe que o operador divida centenas de PDFs padronizados à mão. O sistema já consegue ler os separadores e identificar os registros. Sugira o envio único com separação automática e revisão dos casos ambíguos. Isso elimina a divisão repetitiva e concentra a conferência onde o vínculo precisa de confirmação.

## Question Style

Good when the answers describe plausible audiences and the recommendation has a stated basis:

> **1. Quem sente este problema mais fortemente?**
> - A. Iniciantes — pouca familiaridade, alta fricção, possível disposição a pagar por simplicidade
> - B. Intermediários — já têm workaround manual, trocam por ganho marginal de tempo
> - C. Avançados — querem controle, rejeitam soluções opinionadas

Good when a concrete answer is not known in advance:

> **2. Qual resultado o usuário deve perceber?** Responda em uma frase.

Bad:

> "Tell me everything about the idea."

Bad:

> "Ótima ideia, aqui está o plano final."

Good when the user's priority changes the recommendation:

> **3. Qual foco vem primeiro?**
> - A. Validar demanda — reduz investimento inicial, mas adia receita.
> - B. Gerar receita — testa disposição a pagar, mas exige uma oferta pronta.
> - C. Aprender com uso interno — simplifica o acesso a usuários, mas não prova demanda externa.
