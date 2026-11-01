# Primeira revisão: UX, design e transações

Use este roteiro no recorte acordado, não como autorização para ampliar a auditoria a todo o produto. Uma tela pode funcionar e ainda ter atrito de uso. Um padrão visual diferente não é defeito sem uma base aplicável.

## UX por tela, durante a navegação

Para cada tela, modal, drawer ou etapa relevante, observe desktop e viewport estreito; inspecione os estados disponíveis e registre os não exercitados. Use screenshots para composição e DOM/medidas para sustentar overflow, tamanho ou espaçamento. Não declare avaliação visual a partir apenas do código.

| Dimensão | Verificar na tarefa real |
|---|---|
| Hierarquia e próxima ação | Objetivo claro; título/status/CTA na ordem útil; ação principal distinta; editar, voltar e recuperar sem perder dados; ausência de pedido de dados inútil em estado vazio. |
| Feedback e conteúdo | Progresso, carregamento, validação, erro e sucesso; mensagem atualizada após transição; motivo e ação de recuperação; rótulos e valores sem redundância confusa. |
| Conformidade visual | Tipografia, cores, componentes, formas, iconografia e estados comparados à referência vigente; diferenciação entre desvio do projeto e sugestão estética. |
| Composição e espaço | Alinhamento entre elementos relacionados, ritmo de gaps e margens, proporção das colunas, largura de leitura, repetição de cards/metadados e espaço sem função; equilíbrio visual em vez de exigir espelhamento. |
| Responsividade | Overflow horizontal, quebra de texto, zoom, conteúdo extenso, CTA fixo cobrindo controles e excesso de rolagem para concluir ou recuperar. Viewport simulado não comprova teclado virtual ou toque físico. |
| Acessibilidade | Labels, contraste quando medido, ordem de leitura/tabulação, foco visível e restaurado, alvos conforme contrato e dispositivo. Diferencie mouse, ponteiro coarse e tela física; não transforme medida desktop em falha móvel. |

Para propor compactação, diga **qual espaço está desperdiçado e qual tarefa melhora**. Preserve separação de grupos, mensagem de validação necessária, legibilidade, respiro e alvos acessíveis; não reduza todos os gaps automaticamente. Ausência de medida não permite afirmar conformidade de contraste ou dimensões. Para tela adequada, registre o que foi observado como adequado; não invente defeitos para preencher a matriz. Para dimensão não avaliada, registre a lacuna.

Nas superfícies administrativas necessárias ao fluxo, confira identificação do registro na fila, no detalhe e na confirmação. Nome e valor iguais não distinguem pedidos: correlacione o ID antes de agir e registre atrito quando for necessário recorrer à URL. Preserve o design administrativo aplicável; não imponha a identidade da vitrine ao painel ou ao provedor externo. Histórico com status repetido exige distinguir eventos de negócio, financeiros e repetição de apresentação; não implica cobrança ou estorno duplicado.

## Preparação de cenários financeiros

1. Recupere decisões e registros locais da integração; confirme configuração efetiva, modalidade/versão e sandbox explícito. Consulte documentação oficial vigente para contas, cartões e resultados de teste; não reutilize instruções incompatíveis de outra API. Uma orientação genérica do provedor não invalida uma restrição deliberada da integração: confronte ambas com a configuração real antes de registrar desvio ou propor alteração. Nunca salve dados sensíveis no relatório.
2. Antes de criar pedido com prazo, confira acesso ao comprador/vendedor necessário, método de teste, preenchimento de campos seguros e caminho de consulta dos resultados. Se só puder conferir campos após criar, registre essa dependência e o prazo. Prepare o que for possível antes de iniciar o relógio; não gere sucessivos pedidos enquanto a mesma dependência impedir avanço.
3. Identifique cada operação de teste e mantenha correlação loja/provedor, valor, horário, prazo e observação de teste quando suportada. Não reutilize link expirado. Antes de nova tentativa, consulte o resultado anterior para evitar duplicidade; se precisar recriar, preserve a relação e o motivo.
4. Campos invisíveis/inacessíveis à automação não provam indisponibilidade geral. Confirme screenshot/DOM, tente recuperação suportada e limitada, e peça preenchimento manual se necessário. Prossiga com verificações independentes; não faça loops de recarga nem desabilite proteções. Após intervenção manual, retome da etapa atual sem repetir envio já concluído.

## Conclusão de cada cenário

| Cenário pertinente | Evidência necessária |
|---|---|
| Aprovação | Resultado financeiro autoritativo, mesmo valor/pedido e estado refletido na loja; navegação/recarga sem depender de `status=approved` na URL. Se só a projeção da loja estiver acessível, declare esse limite. |
| Recusa | Cenário oficial de recusa executado; estado recusado no provedor e apresentação/recuperação coerente na loja. Expiração não substitui recusa de cartão. |
| Expiração/cancelamento | Prazo ou ação executada, estado final e disponibilidade da recuperação; separar cancelamento operacional de estado financeiro. |
| Estorno | Pagamento previamente aprovado, solicitação rastreável, status e valor efetivamente reembolsado no provedor e reflexo na loja. Aceite da solicitação, `refund_requested`, HTTP 200 ou pedido cancelado não comprovam estorno concluído. |
| Retentativa e retorno | Não criar cobrança/pedido indevido; preservar a correlação; observar mensagem e próxima ação após transições. Não confundir webhook, polling e atualização manual sem evidência específica. |

Registre como `não aplicável` apenas o que não integra a modalidade/escopo, com justificativa. Enquanto um resultado assíncrono não chegar, marque a verificação final como não testada ou bloqueada com motivo, e registre o intermediário comprovado. Estabeleça acompanhamento limitado pelo prazo real da operação; não declare sucesso apenas para encerrar a sessão.

## Divergência entre provedor e aplicação

Compare, para a mesma operação, resultado do provedor, estado financeiro no backend/painel e mensagem/ação disponíveis ao comprador. Registre valor, IDs não secretos, sequência e horário com fuso quando conhecido; não presuma que relógios de serviços diferentes usam o mesmo fuso. Verifique o estado persistido sem depender dos parâmetros de retorno. Uma confirmação posterior pode atualizar uma lacuna anterior, sem apagar a evidência intermediária.

Exemplo: cenário oficial recusado no provedor → aplicação pendente/em conferência → pedido expira. A etapa externa de recusa foi executada; se a aplicação não oferece o resultado/recuperação esperados, marque o cenário integrado `falhou`, com achado e causa aberta. A expiração posterior não substitui o tratamento de recusa nem transforma o caso em `passou` ou `não testado`. Se houver janela assíncrona documentada ainda em curso, registre o intermediário e acompanhe até seu limite antes de concluir. Não force status, desative validações ou gere outra cobrança para mascarar a divergência.

Sem payload sanitizado e logs correlacionados, não atribua a causa a campo ausente, webhook ou adaptador específico. Leitura de código indica onde investigar. Feche o relatório com resultado executado, limite de diagnóstico e próxima correção/reteste, preservando o escopo de auditoria.

## Evitar na primeira entrega

- “Testes verdes, UX fica para depois”: testes funcionais não cobrem composição visual.
- “Usa Vuetify, logo precisa parecer M3”: preserve o sistema aprovado do projeto.
- “Mais clean = menos espaço em tudo”: compactação precisa preservar leitura e interação.
- “A URL aprovou / cancelou, está resolvido”: consultar estado persistido e distinguir pagamento de devolução.
- “Já vi esse bloqueio”: confira se o usuário resolveu a etapa; retome sem repetir trabalho ou perder prazo.
