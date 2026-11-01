# B — Auditoria parcial do pedido, b19

## Contexto

- Jornada solicitada: cardápio público → carrinho → checkout → pagamento → resultado e retomada. Ambiente: versão publicada b19. Navegador e data não informados; sessão deve permanecer disponível ao proprietário.
- Fonte: registros recebidos, sem execução própria. Autorização: percorrer e diagnosticar. Não há autorização para pedido, cobrança ou mensagem real.
- A validação da conta depende do proprietário. A conta de pagamento só existe em produção; o E2E com resposta falsa comprova apenas a simulação.

## Cobertura

| Etapa e estado | Ambiente/perfil/viewport | Resultado | Evidência ou motivo |
|---|---|---|---|
| Cardápio público: navegação exercitada | publicado b19, público, desktop não discriminado | passou | Registro relata exercício bem-sucedido. |
| Carrinho: caminho desktop exercitado | publicado b19, público, desktop | passou | Registro relata exercício bem-sucedido. |
| Checkout: acesso e etapas posteriores | publicado b19, conta do proprietário, viewport não informado | bloqueado | Validação de conta depende do proprietário, sem resposta. |
| Pagamento real, retorno e confirmação autoritativa | produção, conta de pagamento, viewport não informado | bloqueado | Conta só em produção; sem autorização para pedido ou cobrança. |
| E2E: retorno de pagamento falso | teste simulado | passou | Teste automatizado passou, sem comprovar integração ou browser publicado. |
| Mobile; entrada inválida; recarga; timeout | publicado b19, caminhos acessíveis | não testado | Registros dizem que permanecem acessíveis e não exercitados. |
| Mensagem ao cliente | produção | não aplicável | Não faz parte da investigação autorizada. |

## Achados

Nenhum defeito ou atrito específico foi demonstrado nos registros disponíveis. Não criar IDs para estados bloqueados ou ainda não testados. Manter um único registro e acrescentar IDs estáveis somente quando houver evidência nova.

## Fechamento

O cardápio público e o carrinho desktop passaram no recorte observado. Checkout, pagamento, retorno e acompanhamento não foram validados no site. Unitários e E2E com pagamento falso estão verdes, mas não comprovam a jornada real. A próxima ação independente é exercitar agora mobile, entradas inválidas, recarga e timeout no b19, registrando etapa/estado e evidência, sem encerrar a sessão do proprietário. Para continuar o checkout, o proprietário precisa validar a conta mantendo a sessão; qualquer pedido/cobrança real exige autorização específica ou ambiente de teste apropriado. Não declarar “fluxo validado”.
