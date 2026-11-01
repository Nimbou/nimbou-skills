# Registro único da auditoria

Atualize o mesmo documento durante descoberta, reparo e reteste. Responda ao usuário em linguagem direta, destacando o impacto e apontando para o registro completo. Resumo curto não significa limitar o número de achados registrados.

## Contexto

- Objetivo e limites da jornada; ramificações/perfis incluídos e excluídos.
- URL/ambiente, versão observada, data, navegador e viewports.
- Autorização vigente: diagnosticar ou também corrigir; decisões anteriores mantidas.
- Origem da evidência: execução própria, registros recebidos ou teste simulado.

## Cobertura

| Etapa e estado | Ambiente/versão, perfil, viewport | Resultado | Evidência ou motivo |
|---|---|---|---|
| Carrinho: recarga com opções | homologação a31, visitante, 390px | falhou | captura/log e passos de F02 |
| Pagamento: recusa | homologação a31, visitante, 390px | bloqueado | conta exige validação pelo proprietário |

Resultados: `passou`, `falhou`, `não testado`, `bloqueado`, `não aplicável`. Uma etapa visitada não comprova todos os seus estados. Informe o motivo de bloqueios e de exclusões; não converta “não testado” em “passou”. Evite percentuais de cobertura sem denominador explícito.

Se só houve observação de um alerta de console, registre o alerta como evidência; o comportamento funcional ainda não exercitado fica `não testado`. Isso não significa que o console não foi observado nem que o alerta já comprovou uma falha funcional.

## Achados

| ID | Tipo | Prioridade e impacto | Confiança | Estado | Evidência/reteste |
|---|---|---|---|---|---|
| F02 | defeito confirmado | alta: pedido perde opções na recarga | alta para o sintoma; causa desconhecida | aberto | passos abaixo; sem reteste |

Tipos:

- **Defeito confirmado:** comportamento observado contradiz regra, contrato ou resultado necessário da jornada.
- **Atrito de uso:** dificuldade observada; explique a tarefa prejudicada sem inventar uma regra de negócio.
- **Melhoria opcional:** oportunidade ou preferência; não é falha do fluxo por si só.

Priorize por bloqueio da tarefa, incorreção de dados/valores, alcance e recuperação. Dê confiança à observação separadamente da hipótese de causa. Um alerta de console sem causa/impacto conhecido recebe estado `em investigação`, sem ser omitido nem tratado automaticamente como defeito crítico.

Sintomas ainda não classificados podem ter tipo `classificação pendente` até haver evidência para um dos três tipos acima. Não invente uma regra de negócio para transformar uma suspeita em defeito.

Para cada ID, inclua:

1. Pré-condições e passos reproduzíveis.
2. Esperado e sua base; observado e evidência sanitizada.
3. Impacto, hipótese de causa identificada como hipótese, e dependências.
4. Decisão: corrigir no escopo autorizado, investigar, adiar ou depender de terceiro.
5. Estado atual e reteste: versão, caso/resultado e evidência; se não executado, motivo.

Exemplo F02: adicionar produto com molho selecionado, recarregar e abrir o carrinho. Esperado: manter a configuração aceita. Observado em a31: produto persiste, molho desaparece. Isso comprova perda da seleção; ainda não comprova qual camada a descarta. Uma correção local em a32 só fecha o defeito após repetir esses passos; não comprova a versão publicada.

## Fechamento

Informe o que passou, o que continua aberto, o que foi corrigido e retestado, e o que não foi exercitado. Diferencie auditoria concluída com pendências de correções aprovadas concluídas. Ações externas bloqueadas têm responsável/condição e próxima ação concreta; continue as verificações independentes possíveis.

Em nova rodada, mantenha IDs e decisões. Só acrescente achado com nova evidência; indique se veio de etapa antes bloqueada, escopo ampliado ou regressão de versão. Não renomeie defeitos antigos como novas melhorias para dar a tarefa por encerrada.
