---
name: flow-audit
description: Use when a user asks what can improve in an existing user journey, requests testing a site from beginning to end, or reports repeated rounds of newly discovered flow problems. Applies across web stacks, including requests such as "o que dá para melhorar no fluxo?".
---

# Flow Audit

Percorra o fluxo real e avalie funcionalidade, UX e design de cada tela na primeira revisão. Não espere “o que mais?” ou um pedido separado de análise visual. Entregue diagnóstico consolidado, não promessa de perfeição.

## Escopo e autorização

Anuncie a skill. Recupere decisões anteriores, ambiente, acesso e diagnóstico existente antes de perguntar. Delimite entrada, objetivo, perfis e ramificações relevantes. Sem fluxo indicado, infira a jornada principal pelo produto e declare o recorte; não transforme a revisão em auditoria ilimitada do sistema.

“O que melhorar?” autoriza investigar e recomendar. “Corrija” autoriza as correções do escopo acordado: preserve essa autorização sem pedi-la novamente. Funcionalidades opcionais, decisões comerciais e publicações seguem sua autorização própria. Use sandbox para ações com efeitos reais; não infira permissão para cobranças, mensagens ou alterações destrutivas em produção.

Esta auditoria de um fluxo existente **não exige nuxt-plan aprovado**. `browser-smoke` verifica uma mudança nas condições daquela skill; `nuxt-audit` revisa código frontend; `nuxt-test`/`e2e-test-quality` cuidam de cobertura persistente. Nenhum substitui percorrer esta jornada. Não crie uma suíte E2E apenas porque pediram testar o site.

## Preparar a primeira revisão

Leia `DESIGN.md`, `GUIDELINES.md`, tokens/componentes e decisões aprovadas disponíveis. Declare qual referência está vigente: o design do projeto tem precedência; Material Design 3 é referência complementar onde compatível, ou base proposta quando não houver sistema definido. Usar Vuetify não torna M3 obrigatório nem autoriza substituir a identidade do produto. Consulte a referência oficial antes de atribuir requisitos específicos a um padrão externo.

Leia [reference/review-checklist.md](reference/review-checklist.md) antes de navegar. Liste as telas e os estados relevantes; prepare tanto a matriz funcional quanto a matriz de UX por tela. Em fluxos transacionais, verifique ambiente, contas, dados de teste, prazo e consulta autoritativa antes de criar operações. Continue a revisão visual e funcional acessível enquanto houver dependência externa.

## Percorrer e registrar

1. Abra o navegador disponível, respeitando a sessão e a preferência do usuário. Use as ferramentas suportadas; se indisponíveis, registre a lacuna. Código e testes ajudam no diagnóstico, mas não comprovam comportamento no navegador. Registros fornecidos são evidência recebida, nunca execução própria.
2. Mapeie etapas e estados antes de concluir. Exercite o caminho principal até o resultado observável, incluindo retorno de serviços externos e retomada. Para cada etapa, considere as variações pertinentes: vazio/carregando/erro/sucesso, validação, edição, voltar, recarga, persistência, sessão/perfil, retentativa, timeout e envio duplicado. Em cada tela, confira hierarquia, próxima ação, feedback, consistência visual, alinhamento, densidade e acessibilidade, além de mobile e teclado/foco; registre resultado e evidência por dimensão, inclusive lacunas. “Clean” significa reduzir ruído e desperdício sem eliminar respiro, legibilidade ou área de interação. Simetria geométrica não prevalece sobre hierarquia e leitura. Em transações, confronte preço e estado exibidos com a fonte autoritativa; parâmetros de retorno não confirmam pagamento.
3. Mantenha **uma matriz de cobertura funcional e uma matriz de UX por tela**: etapa/estado, versão/ambiente/perfil/viewport, resultado (`passou`, `falhou`, `não testado`, `bloqueado`, `não aplicável`) e evidência ou motivo. Na matriz funcional, use somente esses resultados; atrito, sugestão e investigação pertencem aos achados, não substituem o estado de execução. Registre console/rede relevantes sem expor credenciais, links privados ou dados pessoais. Acesso bloqueado não encerra caminhos independentes acessíveis; mocks comprovam somente a simulação.
4. Mantenha **um único registro de achados com IDs estáveis**, conforme [reference/report.md](reference/report.md). Separe defeito confirmado, atrito de uso e melhoria opcional; sintomas sem causa definida continuam em investigação. Registre todos os achados conhecidos, inclusive alertas ainda inexplicados, sem quota de três ou cinco sugestões. Não preencha lacunas com recomendações genéricas.

Salve matriz e achados na convenção do projeto; sem convenção, use `docs/plans/flow-audit/<data>-<fluxo>.md`. Sem repositório gravável, entregue no chat. A primeira entrega já contém o diagnóstico disponível e suas lacunas, não apenas a promessa de registrá-lo depois. Prazo curto exige declarar cobertura parcial, nunca ocultar achados.

## Corrigir e encerrar

Em modo de correção, complete o levantamento antes de corrigir; antecipe somente reparos autorizados necessários para desbloquear a investigação. Priorize impacto e dependências. Use a skill de diagnóstico/implementação adequada ao problema. Tentativas repetidas sem resultado exigem investigar a causa, não acrescentar esperas arbitrárias.

Atualize os mesmos IDs após cada reparo. Reproduza o caso que falhava e estados adjacentes; ao final, repita a jornada principal e os erros afetados na versão corrigida. CI verde ou um caminho feliz não encerram pendências. Distinga correção local, publicação e verificação publicada; não publique apenas para concluir uma auditoria.

Encerre com cobertura contabilizada sem somar retestes como casos novos, matriz de UX de todas as telas do recorte, achados priorizados, correções/retestes comprovados e pendências com motivo e próxima ação. Em pagamentos, separe criação, aprovação, recusa, expiração, cancelamento e estorno; resultado solicitado/processando não significa concluído. Um cenário executado que termina em divergência é teste concluído com falha, não teste pendente; relatar a falha não autoriza corrigi-la. Não declare validação integral com etapas bloqueadas. Uma nova pergunta “o que mais?” retoma este registro: novos achados precisam de nova evidência ou mudança de escopo/versão. O objetivo é fechar os problemas conhecidos do recorte, não prometer encontrar toda melhoria imaginável.
