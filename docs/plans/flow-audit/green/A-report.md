# A — Auditoria do pedido, a31

## Contexto

- Jornada: cardápio → produto → carrinho → endereço → cotação → pagamento → acompanhamento, incluindo as variações observadas. Recorte inferido como o pedido principal do restaurante; perfis de conta e sessão não informados.
- Ambiente: homologação, build a31, desktop e mobile 390px. Navegador e data dos registros não informados.
- Fonte: registros de observação fornecidos; nenhuma execução própria. Autorização: investigar e recomendar, sem autorização para corrigir ou publicar. Não há nuxt-plan aprovado, o que não impede esta auditoria.

## Cobertura

| Etapa e estado | Ambiente/perfil/viewport | Resultado | Evidência ou motivo |
|---|---|---|---|
| Cardápio: requisição lenta com sucesso | a31, perfil não informado, desktop/mobile não discriminado | falhou | Exibe “Pagamento indisponível” antes de mostrar o cardápio. |
| Produto: opção obrigatória ausente e selecionada | a31, perfil/viewport não discriminados | passou | Anuncia a exigência e impede adicionar sem seleção. |
| Carrinho: editar quantidade e preço | a31, perfil/viewport não discriminados | passou | Preço atualizado corretamente. |
| Carrinho: recarregar com opções selecionadas | a31, perfil/viewport não discriminados | falhou | Itens persistem; opções desaparecem. |
| Endereço: número em branco | a31, perfil/viewport não discriminados | falhou | Envio aceito; resumo mostra “undefined”. |
| Cotação: mudar bairro | a31, perfil/viewport não discriminados | falhou | Taxa antiga continua até navegação posterior. |
| Carrinho mobile: acionar checkout | a31, perfil não informado, 390px | falhou | Botão fica sob sobreposição fixa e não pode ser acionado. |
| Pagamento: clique duplo | a31, perfil/viewport não discriminados, provedor de teste | falhou | São criados os pedidos 51 e 52. |
| Pagamento: retorno aprovado com API pendente | a31, perfil/viewport não discriminados, provedor de teste | falhou | URL tem `status=approved`; API retorna pendente; página diz “Pedido pago”. |
| Acompanhamento: prazo exibido | a31, perfil/viewport não discriminados | passou | Pedido aceito exibe 40–60 minutos. Apenas a exibição foi observada. |
| Acompanhamento: recarga e retomada | a31, perfil/viewport não discriminados | falhou | Recarga leva ao cardápio sem caminho de volta ao pedido. |
| Retorno de pagamento: comportamento funcional associado ao aviso de console | a31, perfil/viewport não discriminados | não testado | O aviso de hidratação foi observado; não houve exercício que estabelecesse efeito funcional, causa ou impacto. |
| Expiração de sessão; teclado/foco; pagamento recusado; perda de rede | a31, perfis/viewports pertinentes | não testado | Registros declaram que esses estados não foram exercitados. |
| Geocodificação | a31 | não aplicável | Serviço futuro ausente; preenchimento manual está disponível. |

## Achados

| ID | Tipo | Prioridade e impacto | Confiança | Estado | Evidência/reteste |
|---|---|---|---|---|---|
| F01 | defeito confirmado | média: mensagem de indisponibilidade falsa durante carregamento | alta para sintoma; causa desconhecida | aberto | Requisição lenta bem-sucedida; sem reteste. |
| F02 | defeito confirmado | alta: configuração do item se perde após recarga | alta para sintoma; causa desconhecida | aberto | Item persiste sem opções; sem reteste. |
| F03 | defeito confirmado | alta: endereço aceito produz resumo inválido | alta para sintoma; regra de obrigatoriedade do número não informada | aberto | Número vazio → “undefined”; sem reteste. |
| F04 | defeito confirmado | alta: taxa apresentada fica obsoleta após mudança de bairro | alta para sintoma; causa desconhecida | aberto | Valor anterior persiste até navegar; sem reteste. |
| F05 | defeito confirmado | crítica: impede checkout em mobile | alta para sintoma; causa desconhecida | aberto | Botão encoberto em 390px; sem reteste. |
| F06 | defeito confirmado | crítica: duplicação de pedido | alta para sintoma; causa desconhecida | aberto | Clique duplo → IDs 51 e 52; sem reteste. |
| F07 | defeito confirmado | crítica: comunica pagamento sem confirmação autoritativa | alta para divergência; causa desconhecida | aberto | API pendente e página “Pedido pago”; sem reteste. |
| F08 | defeito confirmado | alta: cliente perde acesso ao acompanhamento após recarga | alta para sintoma; causa desconhecida | aberto | Recarga redireciona ao cardápio; sem reteste. |
| F09 | classificação pendente | indeterminada: aviso de hidratação no retorno | alta para presença do aviso; causa/impacto desconhecidos | em investigação | Console no retorno; comportamento funcional associado não testado. |
| F10 | melhoria opcional | baixa: possível conveniência na digitação de endereço | alta para ausência do serviço; valor não avaliado | adiado | Geocodificação futura mencionada pelo proprietário; entrada manual funciona. |

### Detalhamento e decisão

- **F01:** Com uma requisição lenta que termina com sucesso, abrir o cardápio. Esperado: estado de carregamento coerente até a resposta. Observado: “Pagamento indisponível” antes de aparecer o menu. Impacto: confunde ou afasta o cliente. Hipótese: estado de carregamento compartilhado ou mensagem prematura, ainda não verificada. Decisão: investigar a origem da mensagem e recomendar correção; sem implementação autorizada.
- **F02:** Selecionar opções de um produto, adicioná-lo e recarregar o carrinho. Esperado: opções aceitas persistem com o item. Observado: item persiste sem as opções. Impacto: pedido pode sair diferente do escolhido. Hipótese de camada responsável ainda não estabelecida. Decisão: priorizar diagnóstico de persistência e correção após autorização.
- **F03:** Deixar número vazio no endereço e enviar. Esperado: o resumo conter um endereço legível ou o formulário informar o dado faltante; a regra de número obrigatório precisa ser confirmada. Observado: envio aceito e “undefined” no resumo. Impacto: dados de entrega incompletos ou confusos. Hipótese: tratamento ausente de valor vazio; não verificada. Decisão: confirmar regra e corrigir apresentação/validação no escopo aprovado.
- **F04:** Cotar entrega, trocar o bairro e observar a taxa antes de navegar. Esperado: taxa correspondente ao bairro atual ou indicação de recálculo. Observado: taxa antiga até navegação posterior. Impacto: valor incorreto pode orientar a decisão. Hipótese: cotação não invalidada na mudança; não verificada. Decisão: investigar origem do valor e corrigir após autorização.
- **F05:** Em 390px, abrir o carrinho e tentar acionar checkout. Esperado: controle alcançável. Observado: sobreposição fixa o cobre. Impacto: impede compra nesse viewport. Hipótese de CSS/layout não confirmada. Decisão: priorizar correção após autorização.
- **F06:** No pagamento de teste, acionar envio duas vezes rapidamente. Esperado: uma tentativa de envio não gerar dois pedidos. Observado: IDs 51 e 52. Impacto: duplicação de pedido; não há evidência de cobrança real. Hipótese: falta de idempotência/bloqueio de envio, não comprovada. Decisão: priorizar investigação e correção do envio e proteção no servidor após autorização.
- **F07:** Retornar do provedor de teste com `status=approved` e conferir a API do pedido. Esperado: comunicar pagamento apenas conforme estado autoritativo, aqui pendente. Observado: “Pedido pago”. Impacto: confiança indevida no pagamento. Hipótese: UI usa parâmetro de retorno como confirmação; não verificada. Decisão: priorizar investigação e correção após autorização.
- **F08:** Abrir acompanhamento do pedido aceito e recarregar. Esperado: retomar o acompanhamento do pedido. Observado: redireciona ao cardápio sem caminho de volta. Impacto: cliente perde referência do pedido. Hipótese: contexto de navegação não persistido; não verificada. Decisão: investigar retomada após autorização.
- **F09:** No retorno do provedor de teste, observar o console. Não há regra funcional ou resultado esperado específico fornecido para esse aviso. Observado: aviso de hidratação, sem mensagem detalhada; comportamento funcional associado não foi exercitado. Decisão: preservar como investigação e correlacionar com o comportamento da página antes de classificá-lo como defeito, atrito ou melhoria.
- **F10:** Serviço de geocodificação foi mencionado como futuro. Não há passo de reprodução de falha: endereço manual está disponível. Decisão: manter como opção futura, fora da correção de defeitos atuais.

Nenhum ID tem reteste ou correção executada. Versão de reteste: não aplicável.

## Fechamento

Há três comportamentos observados como esperados (validação da opção obrigatória, edição de quantidade/preço e exibição do prazo), oito defeitos observados, um aviso em investigação e uma melhoria opcional futura. A cobertura não é integral: sessão expirada, teclado/foco, recusa, perda de rede e vários estados de loading/erro permanecem sem exercício. Próxima ação: preservar os IDs, completar essas variações em homologação e diagnosticar primeiro F05–F07, F02–F04 e F08, usando a API de pedidos como fonte do estado de pagamento. A implementação depende de autorização do usuário; esta revisão não a concede.
