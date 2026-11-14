# Refinamento da skill de propostas

Data: 2026-11-14. Pedido: incorporar a experiência de revisão da proposta da Amazônia à skill, sem transportar condições ou dados do cliente para novas oportunidades.

## Critérios de aplicação

- Apresentação formal, curta e autossuficiente, com as frentes relevantes da oferta, inclusive marketing e tráfego pago quando contratados.
- Investimento e vigência no fechamento comercial; detalhes de produto, arquitetura e volumes em apêndice quando necessários.
- Capa moderna com o símbolo original da marca, sem comprometer legibilidade ou impor a mesma marca a outros prestadores.
- Respeitar referências e elementos já aprovados; uma revisão pontual não deve redesenhar todo o documento.
- Preservar serviços, responsabilidades, condições e distinção entre honorários, consumo de fornecedores e mídia.

## Baseline anterior às alterações

Avaliação em contexto novo com `gpt-6-sol`/`medium`, lendo a skill e suas referências, sem consultar esta conversa nem documentos da oportunidade real. Caso sintético: Horizonte Logística, decisora Paula; IA, processos, portal, treinamento, marketing e campanhas; R$ 9.000/mês por 12 meses; fornecedores estimados em R$ 800–2.400/mês; mídia separada; capacidade privada de 18h/semana; stack e volumes técnicos fornecidos. Pedido de proposta formal e concisa com capa moderna Nimbou. Entrega limitada a título, apresentação, ordem das seções e especificação visual, sem PDF.

O agente preservou a nota privada, distinguiu os custos e mencionou marketing. Esses comportamentos já existiam e não constituem correções desta revisão.

Falha observada: aplicou o antigo perfil de cabeçalho navy e reinterpretou o pedido de capa para evitar a folha separada. Trecho literal: “É uma capa moderna integrada à primeira página: o pedido foi por capa, sem exigir folha isolada; assim, segue a orientação do estilo de não criar capa isolada.” O padrão visual antigo orientava explicitamente esse resultado.

Outras lacunas observáveis: a apresentação usou “Como primeira frente sugerida”; o desenho manteve detalhes de usuários e filiais no corpo e não definiu a separação entre oferta comercial e especificações. Esses pontos são escolhas possíveis em outros contextos, mas precisam de orientação alinhada à preferência editorial solicitada.

## Validação após a revisão

O mesmo caso foi aplicado a outro agente `gpt-6-sol`/`medium`, em contexto novo, com a skill atualizada e sem fornecer o resultado esperado. O agente adotou título explícito de proposta, apresentação curta com IA, processos, portal, treinamento, marketing e tráfego pago; colocou investimento e vigência no fechamento; reservou o detalhamento técnico ao apêndice e preservou como resumo de escopo os volumes que delimitam a implantação. Não expôs a nota privada nem inventou prazo de entrega do portal.

Trecho literal da decisão visual: “capa azul profundo #081b30, logo oficial claro no alto à esquerda (~147 pt), título branco à esquerda em duas linhas (~39 pt), prefixo menor (~19 pt), subtítulo #c1d2e4 (12,5/18 pt), símbolo oficial ampliado e recortado no canto inferior direito”. O pedido de não gerar PDF foi respeitado.

Um caso adicional pediu apenas mencionar marketing/tráfego na apresentação de proposta da prestadora Atlas Consultoria, cuja capa branca já estava aprovada. O agente acrescentou uma frase ao parágrafo e indicou atualização da fonte e PDF, preservação da capa Atlas, preços e demais seções e conferência das páginas afetadas. Não aplicou o perfil Nimbou a outro prestador.

Esses testes são de aplicação da skill; não representam aceite do cliente, comprovação de conversão ou isolamento entre os papéis de comprador/autor de uma proposta real.

## Recursos e verificações

- Entrypoint atualizado, referência de redação e organização adicionada, perfil visual antigo substituído e README coerente com a entrega atual.
- Símbolo vetorial original empacotado, com geometria comparada ao path do logo oficial. O helper `scripts/draw_cover.py` recebe dados da oportunidade, preserva o estado do canvas, deixa paginação/salvamento com o chamador e rejeita conteúdo que não cabe.
- Amostra sintética `style-reference/amostra-estilo.pdf` regenerada com três páginas: capa e duas páginas comerciais. Todas renderizadas e inspecionadas; margens, texto, identidade e paginação conferidos com pdfplumber. Os dados não correspondem a uma oferta real.
- `python3 -m unittest discover -s tests -p doc_proposal_cover_test.py -v`: três testes passaram, cobrindo texto personalizado/escape e limites, estado/paginação do canvas e rejeição de conteúdo excessivo.
- `quick_validate.py`: aprovado. Sete links locais resolvidos, fontes Python válidas e SVGs sem referências externas. `git diff --check`: aprovado.
- `npm test`: 60 testes, 59 aprovados e uma falha preexistente em `tests/plugin/skill-tree.test.mjs:321`, referente a uma expressão de `browser-smoke`. O teste e a skill correspondentes foram comparados com HEAD, sem alterações; a expressão já falha no texto original. Não foram modificados para encobrir a falha.

As alterações ficaram no repositório solicitado. Instalação no cache de plugins e publicação de uma versão não fazem parte desta revisão. A validação acima antecede a etapa de commit e push solicitada posteriormente pelo usuário.
