# Registro único da auditoria

Atualize o mesmo documento durante descoberta, reparo e reteste. Responda ao usuário em linguagem direta, destacando o impacto e apontando para o registro completo. Resumo curto não significa limitar o número de achados registrados.

## Contexto

- Objetivo e limites da jornada; ramificações/perfis incluídos e excluídos.
- URL/ambiente, versão observada, data, navegador e viewports.
- Autorização vigente: diagnosticar ou também corrigir; decisões anteriores mantidas.
- Origem da evidência: execução própria, registros recebidos ou teste simulado.
- Design vigente: documentos/decisões e versão; papel de referências externas como M3; conflitos ou ausência de padrão explicitados.

## Cobertura

| Etapa e estado | Ambiente/versão, perfil, viewport | Resultado | Evidência ou motivo |
|---|---|---|---|
| Carrinho: recarga com opções | homologação a31, visitante, 390px | falhou | captura/log e passos de F02 |
| Pagamento: recusa | homologação a31, visitante, 390px | bloqueado | conta exige validação pelo proprietário |

Resultados: `passou`, `falhou`, `não testado`, `bloqueado`, `não aplicável`. Uma etapa visitada não comprova todos os seus estados. Informe o motivo de bloqueios e de exclusões; não converta “não testado” em “passou”. Evite percentuais de cobertura sem denominador explícito. Use o valor exato na coluna Resultado e ponha qualificações na evidência; testes automatizados recebidos ficam identificados como recebidos, sem inventar quais etapas cobrem.

Se só houve observação de um alerta de console, registre o alerta como evidência; o comportamento funcional ainda não exercitado fica `não testado`. Isso não significa que o console não foi observado nem que o alerta já comprovou uma falha funcional.

## UX e design por tela

Preencha já na primeira revisão, conforme [review-checklist.md](review-checklist.md). Uma linha por tela/etapa relevante, incluindo superfícies sem achados. Nas células, registre observação e evidência, ou `não avaliado` com motivo; um “OK” genérico não comprova todas as dimensões. Dimensões independentes podem ter resultados diferentes na mesma tela.

| Tela/estado e viewport | Hierarquia, ação e feedback | Design vigente | Alinhamento, densidade e respiro | Responsividade e acessibilidade | Evidência, IDs e lacunas |
|---|---|---|---|---|---|
| Revisão, desktop/390px | próxima ação clara; erro não exercitado | Editar usa estilo nativo divergente do sistema aprovado | reserva vazia entre campos amplia rolagem; preservar erros e alvos | sem overflow observado; teclado não avaliado | captura; F03; revisar foco |

Uma melhoria visual deve citar base, observação e ganho para a tarefa. Classifique preferência estética como opcional; desvio comprovado do contrato e atrito observado recebem classificação própria. Não impor simetria ou M3 onde isso contraria a composição aprovada.

## Operações externas, quando aplicável

| Cenário | Ambiente, ID loja/provedor e valor | Prazo/horários | Resultado autoritativo | Reflexo na aplicação | Evidência e limite |
|---|---|---|---|---|---|
| Estorno sandbox | IDs sanitizados de correlação; valor | solicitado/verificado | solicitado; conclusão não verificada | pedido cancelado | solicitação comprovada; devolução final bloqueada por acesso |

Não incluir senhas, tokens, links privados de acompanhamento ou URLs de checkout/autenticação completas. Identificadores de correlação não secretos bastam. Registre operações criadas, expiradas, canceladas e pendentes; documente intervenção manual. Aprovação, recusa, expiração e estorno são verificações distintas. Nunca somar retestes da mesma etapa como expansão de cobertura.

Em cenários com divergência, separe o resultado externo do cenário integrado: por exemplo, provedor recusou, mas aplicação ficou em conferência e expirou. Registre `falhou` para o resultado integrado comprovadamente incorreto, preservando a sequência e a causa ainda desconhecida. Não use falta de diagnóstico como sinônimo de falta de execução. Identifique a origem recebida/própria de cada evidência sem inventar nova verificação.

## Achados

| ID | Tipo | Prioridade e impacto | Confiança | Estado | Evidência/reteste |
|---|---|---|---|---|---|
| F02 | defeito confirmado | alta: pedido perde opções na recarga | alta para o sintoma; causa desconhecida | aberto | passos abaixo; sem reteste |

Tipos:

- **Defeito confirmado:** comportamento observado contradiz regra, contrato ou resultado necessário da jornada.
- **Atrito de uso:** dificuldade observada; explique a tarefa prejudicada sem inventar uma regra de negócio.
- **Melhoria opcional:** oportunidade ou preferência; não é falha do fluxo por si só.

Priorize por bloqueio da tarefa, incorreção de dados/valores, alcance e recuperação. Dê confiança à observação separadamente da hipótese de causa. Um alerta de console sem causa/impacto conhecido recebe estado `em investigação`, sem ser omitido nem tratado automaticamente como defeito crítico.

Use exatamente um desses três tipos, ou `classificação pendente` enquanto faltar base. “Desvio visual”, “acessibilidade” e “financeiro” são temas, não novos tipos; `em investigação` é estado. Sintomas ainda não classificados podem ter tipo `classificação pendente` até haver evidência para um dos três tipos acima. Não invente uma regra de negócio para transformar uma suspeita em defeito.

Para cada ID, inclua:

1. Pré-condições e passos reproduzíveis.
2. Esperado e sua base; observado e evidência sanitizada.
3. Impacto, hipótese de causa identificada como hipótese, e dependências.
4. Decisão: corrigir no escopo autorizado, investigar, adiar ou depender de terceiro.
5. Estado atual e reteste: versão, caso/resultado e evidência; se não executado, motivo.

Exemplo F02: adicionar produto com molho selecionado, recarregar e abrir o carrinho. Esperado: manter a configuração aceita. Observado em a31: produto persiste, molho desaparece. Isso comprova perda da seleção; ainda não comprova qual camada a descarta. Uma correção local em a32 só fecha o defeito após repetir esses passos; não comprova a versão publicada.

## Fechamento

Informe o que passou, o que continua aberto, o que foi corrigido e retestado, e o que não foi exercitado. Conte os resultados da matriz atual e indique substituições de rodadas anteriores; inclua síntese de UX por tela e o estado final de cada operação externa. Não preserve resumo inicial desatualizado que contradiga a conclusão mais recente. Diferencie auditoria concluída com pendências de correções aprovadas concluídas. Ações externas bloqueadas têm responsável/condição e próxima ação concreta; continue as verificações independentes possíveis.

Em nova rodada, mantenha IDs e decisões. Só acrescente achado com nova evidência; indique se veio de etapa antes bloqueada, escopo ampliado ou regressão de versão. Não renomeie defeitos antigos como novas melhorias para dar a tarefa por encerrada.
