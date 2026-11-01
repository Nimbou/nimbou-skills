# C — Reparos F01–F04, estado local c20

## Contexto

- Jornada: checkout e retorno/acompanhamento, com problemas F01–F04 já aprovados para correção. F05, geocodificação, foi adiado explicitamente.
- Evidência: registros recebidos após trabalho local; nenhuma execução própria. Versões: local c20 e publicada b19. Navegador, perfil, viewport e data não informados.
- Autorização: corrigir F01–F04. Não há evidência de publicação nem de verificação publicada.

## Cobertura

| Etapa e estado | Ambiente/perfil/viewport | Resultado | Evidência ou motivo |
|---|---|---|---|
| Checkout: prevenção de pedidos duplicados (F01) | local c20, perfil/viewport não informados | passou | Registro afirma que checkout local não cria mais duplicatas. Passos e quantidade de repetições não fornecidos. |
| Caminho feliz do checkout | local c20, perfil/viewport não informados | passou | Uma execução de navegador passou; não cobre erros e recargas. |
| Carrinho: recarga com opções (F02) | local c20, perfil/viewport não informados | falhou | Ainda perde as opções selecionadas. |
| Acompanhamento: retorno com URL editada e pedido pendente (F03) | local c20, perfil/viewport não informados | falhou | Ainda rotula pedido pendente como pago. |
| Retorno: comportamento funcional associado ao aviso de hidratação (F04) | local c20, perfil/viewport não informados | não testado | Aviso observado; não houve exercício que estabelecesse efeito funcional ou causa. |
| CI: checagens unitárias | local c20 | passou | Verde, mas não substitui os casos de navegador que falharam. |
| Jornada principal e erros afetados na versão publicada | publicado b19 | não testado | Correções só existem no c20; sem publicação ou execução de navegador no publicado. |
| Geocodificação F05 | local/publicado | não aplicável | Explicitamente adiada. |

## Achados

| ID | Tipo | Prioridade e impacto | Confiança | Estado | Evidência/reteste |
|---|---|---|---|---|---|
| F01 | defeito confirmado no registro anterior | alta: pedidos duplicados | alta para resultado local relatado | corrigido localmente; publicado não verificado | c20 não duplica; sem comprovante de publicação. |
| F02 | defeito confirmado | alta: opções selecionadas somem após recarga | alta para sintoma; causa desconhecida | aberto | c20 ainda falha; segunda tentativa com espera maior falhou. |
| F03 | defeito confirmado | crítica: pedido pendente informado como pago | alta para divergência; causa desconhecida | aberto | URL de retorno editada, pedido pendente, página diz pago no c20. |
| F04 | classificação pendente | impacto indeterminado: aviso de hidratação | alta para presença; causa/impacto desconhecidos | em investigação | Aviso permanece no c20; comportamento funcional associado não testado. |
| F05 | melhoria opcional | conveniência futura | alta para decisão anterior | adiado | Geocodificação explicitamente fora desta correção. |

### Detalhamento e decisão

- **F01:** Pré-condição: checkout local c20; modo de disparar duplicação anterior não especificado neste registro. Esperado: um envio não gerar pedidos duplicados. Observado agora: checkout não cria duplicatas, conforme registro. Decisão: manter como corrigido localmente; confirmar com o mesmo caso e estados adjacentes antes de fechar em qualquer versão publicada. Não inferir resultado no b19.
- **F02:** Selecionar opções no carrinho e recarregar. Esperado: preservar as opções escolhidas. Observado: somem no c20. Impacto: pedido pode divergir da escolha. A primeira tentativa alterou a inicialização de estado do componente; a segunda repetiu a alteração com atraso maior, sem sucesso. Isso não estabelece causa; investigar a persistência, hidratação e leitura/escrita efetivas de dados antes de um novo reparo. Decisão: continuar dentro da aprovação F01–F04, retestar no c20.
- **F03:** Editar a URL de retorno para um pedido ainda pendente e abrir acompanhamento. Esperado: apresentar pendente conforme estado autoritativo. Observado: página o chama de pago. Impacto: confirmação falsa. Hipótese de confiança indevida no retorno precisa de confirmação no código/rede. Decisão: corrigir sob aprovação existente e reproduzir retorno adulterado e retorno normal.
- **F04:** No retorno, observar o console. Não há regra funcional ou resultado esperado específico fornecido para esse aviso. Observado: aviso de hidratação continua; comportamento funcional associado não foi exercitado. Decisão: investigar causa e possível efeito, manter o ID e a autorização de correção existente; não fechar nem reclassificar sem evidência.
- **F05:** Serviço de geocodificação opcional foi adiado pelo usuário. Decisão: preservar adiamento; nenhuma implementação ou reteste neste escopo.

## Fechamento

A correção autorizada não está concluída: F02 e F03 falham no c20, F04 permanece em investigação e F01 só tem resultado local. O caminho feliz e a CI verdes não cobrem esses casos. Próxima sequência: diagnosticar F02 por evidência da persistência, corrigir F02/F03, determinar a causa e o impacto de F04, retestar cada ID e estados adjacentes no c20, depois repetir jornada e erros afetados na versão que vier a ser publicada. Publicação não está comprovada nem é consequência automática deste relatório. Preservar F05 adiado.
