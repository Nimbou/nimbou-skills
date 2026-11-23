# idea — processo da entrevista

Referência para ideias que exigem exploração mais profunda. Use as etapas de investigação conforme a necessidade. Siga a sequência obrigatória do [SKILL.md](../SKILL.md) para definir o objetivo, comparar três caminhos e recomendar um deles antes de refinar.

## Process

### 1. Restate the Idea

Begin by briefly restating what you understood. Free-text is appropriate here — no question yet.

Your restatement should include:

- The core idea
- The primary objective, stated as an outcome
- The target user or audience, if known
- The expected outcome, if known
- Any assumptions you are already making

Then ask the independent questions that could change the next decision, grouped into an answerable batch. Defer questions whose framing depends on an earlier answer. Use options only when they describe real alternatives, as explained in `SKILL.md`.

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

### 9. Compare Three Paths

Trace how the work would get done from start to finish. Look for steps that can be removed, combined, or handled by a system already in use. Consider rules and existing capabilities, and identify any specific gap that automation or AI might close. Count the work shifted to other people or systems, including review, exceptions, and maintenance.

Present three genuinely different paths to the same objective. When the constraints rule out immediate rollout, consider viable options such as keeping the current process for the time being or running a small pilot. Make clear which assumptions each path depends on.

Explain how each path works, its main trade-off, its practical consequences, and when it makes sense. Compare the options on factors that could change the decision, such as time, recurring work, cost, accuracy, and effects on downstream users or workflows.

### 10. Stress-Test the Options and Recommend a Path

Test the strongest assumption and the most consequential failure in each path. Consider how a failure would be detected, who would handle it, and how it could be corrected. Useful questions:

- "Se essa etapa falhar, quem percebe e como corrige?"
- "A mudança elimina trabalho ou desloca o esforço para outra pessoa?"
- "Que resultado de um teste pequeno mudaria a recomendação?"

Recommend the path that best meets the objective under the known constraints. Explain why the original proposal should be replaced when its premise fails or another path delivers a better overall outcome. Say when the recommendation would change.

### 11. Refine the Selected Approach

After presenting the comparison and recommendation, refine the selected approach. Focus on what would make it work, such as a narrower scope, a simpler first version, clearer success criteria, or a better validation path.

Confirm with the user when a refinement would change their objective.

### 12. Check for Remaining Doubts

Before ending, perform an internal uncertainty check:

- Do I understand the problem?
- Do I understand who this is for?
- Do I understand why it matters?
- Is there one primary objective for each idea, with an observable outcome where possible?
- Do I understand the constraints?
- Did I compare three distinct paths and their main consequences?
- Can I explain why the recommended path best serves the objective?
- Do I understand the assumptions?
- Do I understand what should be tested first?

If an unanswered doubt blocks the next decision, ask about it. Otherwise, record it as an assumption to validate and conclude.

## Exemplo de comparação

A proposta é pedir ao operador que divida um PDF e anexe cada parte separadamente. O processo recebe muitos PDFs, a maioria com separadores padronizados e alguns com páginas digitalizadas.

**Objetivo principal.** Anexar cada documento ao registro correto a partir de um único PDF, reduzindo o tempo de trabalho sem aumentar os erros de vinculação.

| Opção | Consequências |
| --- | --- |
| A. Divisão e anexação manuais | Exige pouca implementação e pode atender casos raros. A cada arquivo, o operador repete o trabalho e pode omitir uma página ou escolher o registro errado. |
| B. Envio único e separação por regras | O sistema lê os separadores e vincula os documentos quando encontra uma referência inequívoca. Reduz o trabalho repetitivo e encaminha páginas sem correspondência para revisão. Mudanças no padrão exigem ajustar as regras. |
| C. Envio único e classificação assistida por IA | OCR e IA podem sugerir a divisão e a vinculação quando faltam separadores ou o conteúdo varia. Aumentam o custo de processamento e podem sugerir um registro errado. O operador confirma os casos ambíguos antes de gravar os anexos. |

**Recomendação.** Começar pela opção B, pois o padrão existente permite ao sistema assumir a maior parte do trabalho com regras verificáveis. A divisão manual recorrente mantém no operador uma etapa que o sistema já pode executar. Medir o tempo por PDF e a taxa de vinculações erradas ou pendentes com uma amostra representativa. As exceções mostram se vale testar IA.

**Ideia resultante.** O operador envia um único PDF. O sistema separa e vincula os documentos com referência inequívoca e mostra os casos pendentes para conferência.

## Question Style

Good when these are three plausible audiences and the recommendation has a stated basis:

> **1. Quem sente este problema mais fortemente?**
> - A. Iniciantes — pouca familiaridade, alta fricção, possível disposição a pagar por simplicidade
> - B. Intermediários — já têm workaround manual, trocam por ganho marginal de tempo
> - C. Avançados — querem controle, rejeitam soluções opinionadas

Good when a concrete answer is not known in advance:

> **2. Qual transformação o usuário deve sentir?** Responda em uma frase; posso comparar opções depois de conhecer seu objetivo.

Bad:

> "Tell me everything about the idea."

Bad:

> "Ótima ideia, aqui está o plano final."

Good when the three alternatives are real and comparable:

> **3. Qual foco vem primeiro?**
> - A. Validar demanda — reduz investimento inicial, mas adia receita.
> - B. Gerar receita — testa disposição a pagar, mas exige uma oferta pronta.
> - C. Aprender com uso interno — simplifica o acesso a usuários, mas não prova demanda externa.
