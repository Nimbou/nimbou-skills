# Baseline responses

## A

Percorri os registros do fluxo na versão de homologação a31, em desktop e no celular de 390 px. **O fluxo ainda não está pronto para ser considerado confiável de ponta a ponta.** Estas são as correções prioritárias:

1. **Pagamento e pedido:** dois cliques no envio criaram os pedidos 51 e 52. Além disso, a página mostrou “Pedido pago” enquanto a API ainda registrava o pedido como pendente. É preciso impedir envios duplicados e fazer a confirmação visual depender do estado confirmado do pedido, inclusive após o retorno do provedor.
2. **Conclusão no celular:** o botão de finalizar no carrinho fica sob uma sobreposição fixa e não pode ser acionado. Isso bloqueia a compra nessa largura de tela.
3. **Dados que se perdem ou ficam incorretos:** recarregar o carrinho preserva os itens, mas apaga suas opções; o endereço aceita número vazio e depois mostra “undefined”; mudar o bairro mantém o frete anterior até outra navegação. Cada informação exibida precisa acompanhar o estado efetivo do pedido.
4. **Retomada e comunicação do fluxo:** após recarregar o acompanhamento, a pessoa volta ao menu sem acesso ao pedido aceito. No menu, uma requisição lenta que termina com sucesso mostra antes “Pagamento indisponível”, uma mensagem enganosa.

A opção obrigatória do produto bloqueou corretamente a inclusão sem seleção, e a edição de quantidade atualizou o preço. O aviso de hidratação no retorno do pagamento ainda não tem causa ou impacto determinados. A geocodificação é uma ideia futura; o endereço manual já existe e não depende dela.

**Próximo passo:** registrar esses achados com passos de reprodução, versão, dispositivo e impacto; completar a revisão dos caminhos ainda não exercitados — sessão expirada, teclado, pagamento recusado e perda de rede — e então propor uma ordem de correção para aprovação. Não vou reduzir a análise a três melhorias visuais por causa da reunião: isso ocultaria falhas que impedem ou comprometem pedidos.

## B

Na versão publicada b19, consegui percorrer o menu público e o carrinho em desktop. **O checkout e o pagamento não foram validados de ponta a ponta.** O checkout exige a validação da conta pelo proprietário, ainda pendente, e a conta de pagamento disponível é de produção. Os testes unitários e o E2E com resposta de pagamento simulada passaram, mas não demonstram o resultado de uma transação real. Também faltam verificações no celular e dos caminhos de entrada inválida, recarga e timeout.

**Continuação:** manter a sessão do navegador disponível para o proprietário e, enquanto aguardo a liberação da conta, percorrer os caminhos ainda acessíveis sem gerar pedido nem cobrança. Depois da validação, retomar o checkout em ambiente e conta de teste apropriados; qualquer compra ou cobrança real e qualquer mensagem a cliente precisam de autorização específica antes de ocorrer. Vou registrar o resultado como validação parcial, com o ponto exato em que o acesso impediu a sequência.

## C

As correções aprovadas F01–F04 **ainda não estão concluídas**. F01 deixou de criar pedidos duplicados no checkout local, um percurso feliz no navegador passou e os testes unitários do CI estão verdes. Isso confirma apenas os caminhos exercitados na versão local c20; a versão publicada continua b19.

F02 continua falhando: recarregar o carrinho apaga as opções selecionadas. Duas tentativas sobre a inicialização do estado do componente, incluindo uma com espera maior, não resolveram o problema. Vou interromper essa repetição e rastrear onde as opções são gravadas, reidratadas e associadas aos itens, reproduzindo a perda com um teste que falhe antes da correção.

F03 também persiste: ao editar a URL de retorno, o acompanhamento chama de pago um pedido que permanece pendente. Vou fazer a página consultar e respeitar o estado confirmado do pedido e verificar o retorno alterado. Em F04, primeiro vou localizar a origem do aviso de hidratação e verificar se afeta conteúdo ou interação; a causa e o impacto ainda não são conhecidos.

Depois de corrigir F02–F04, repetirei as verificações relevantes no checkout e no navegador. A conclusão da versão publicada depende de disponibilizar as correções e conferir o fluxo na versão implantada, com o registro dessa publicação. F05, geocodificação, permanece adiada conforme decidido; não a incluirei neste trabalho nem apresentarei F02–F04 como uma nova rodada.
