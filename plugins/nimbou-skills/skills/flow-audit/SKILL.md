---
name: flow-audit
description: Use when a user asks what can improve in an existing user journey, requests testing a site from beginning to end, or reports repeated rounds of newly discovered flow problems. Applies across web stacks, including requests such as "o que dá para melhorar no fluxo?".
---

# Flow Audit

Percorra o fluxo real e entregue um diagnóstico consolidado na primeira revisão. Não espere perguntas repetidas para revelar problemas já conhecidos.

## Escopo e autorização

Anuncie a skill. Recupere decisões anteriores, ambiente, acesso e diagnóstico existente antes de perguntar. Delimite entrada, objetivo, perfis e ramificações relevantes. Sem fluxo indicado, infira a jornada principal pelo produto e declare o recorte; não transforme a revisão em auditoria ilimitada do sistema.

“O que melhorar?” autoriza investigar e recomendar. “Corrija” autoriza as correções do escopo acordado: preserve essa autorização sem pedi-la novamente. Funcionalidades opcionais, decisões comerciais e publicações seguem sua autorização própria. Use sandbox para ações com efeitos reais; não infira permissão para cobranças, mensagens ou alterações destrutivas em produção.

Esta auditoria de um fluxo existente **não exige nuxt-plan aprovado**. `browser-smoke` verifica uma mudança nas condições daquela skill; `nuxt-audit` revisa código frontend; `nuxt-test`/`e2e-test-quality` cuidam de cobertura persistente. Nenhum substitui percorrer esta jornada. Não crie uma suíte E2E apenas porque pediram testar o site.

## Percorrer e registrar

1. Abra o navegador disponível, respeitando a sessão e a preferência do usuário. Use as ferramentas suportadas; se indisponíveis, registre a lacuna. Código e testes ajudam no diagnóstico, mas não comprovam comportamento no navegador. Registros fornecidos são evidência recebida, nunca execução própria.
2. Mapeie etapas e estados antes de concluir. Exercite o caminho principal até o resultado observável, incluindo retorno de serviços externos e retomada. Para cada etapa, considere as variações pertinentes: vazio/carregando/erro/sucesso, validação, edição, voltar, recarga, persistência, sessão/perfil, retentativa, timeout e envio duplicado. Confira mobile e teclado/foco onde aplicável. Em transações, confronte preço e estado exibidos com a fonte autoritativa; parâmetros de retorno não confirmam pagamento.
3. Mantenha **uma matriz de cobertura**: etapa/estado, versão/ambiente/perfil/viewport, resultado (`passou`, `falhou`, `não testado`, `bloqueado`, `não aplicável`) e evidência ou motivo. Registre console/rede relevantes sem expor credenciais ou dados pessoais. Acesso bloqueado não encerra caminhos independentes acessíveis; mocks comprovam somente a simulação.
4. Mantenha **um único registro de achados com IDs estáveis**, conforme [reference/report.md](reference/report.md). Separe defeito confirmado, atrito de uso e melhoria opcional; sintomas sem causa definida continuam em investigação. Registre todos os achados conhecidos, inclusive alertas ainda inexplicados, sem quota de três ou cinco sugestões. Não preencha lacunas com recomendações genéricas.

Salve matriz e achados na convenção do projeto; sem convenção, use `docs/plans/flow-audit/<data>-<fluxo>.md`. Sem repositório gravável, entregue no chat. A primeira entrega já contém o diagnóstico disponível e suas lacunas, não apenas a promessa de registrá-lo depois. Prazo curto exige declarar cobertura parcial, nunca ocultar achados.

## Corrigir e encerrar

Em modo de correção, complete o levantamento antes de corrigir; antecipe somente reparos autorizados necessários para desbloquear a investigação. Priorize impacto e dependências. Use a skill de diagnóstico/implementação adequada ao problema. Tentativas repetidas sem resultado exigem investigar a causa, não acrescentar esperas arbitrárias.

Atualize os mesmos IDs após cada reparo. Reproduza o caso que falhava e estados adjacentes; ao final, repita a jornada principal e os erros afetados na versão corrigida. CI verde ou um caminho feliz não encerram pendências. Distinga correção local, publicação e verificação publicada; não publique apenas para concluir uma auditoria.

Encerre com cobertura contabilizada, achados priorizados, correções/retestes comprovados e pendências com motivo e próxima ação. Não declare validação integral com etapas bloqueadas. Uma nova pergunta “o que mais?” retoma este registro: novos achados precisam de nova evidência ou mudança de escopo/versão. O objetivo é fechar os problemas conhecidos do recorte, não prometer encontrar toda melhoria imaginável.
