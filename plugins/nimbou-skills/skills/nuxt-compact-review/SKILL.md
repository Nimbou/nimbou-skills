---
name: nuxt-compact-review
description: Revise e ajuste páginas e componentes Nuxt/Vue existentes usando screenshots reais do navegador para reduzir espaço vazio, corrigir alinhamento e melhorar densidade e UX responsiva. Use para compactação visual de telas ou módulos; não para criar uma identidade visual ou auditar apenas arquitetura.
---

# Nuxt Compact Review

Melhore a interface renderizada, não apenas o CSS. O resultado deve ser compacto, legível e alinhado, com evidência visual antes/depois e ações funcionando.

## Recorte

- Leia as instruções locais e `DESIGN.md`/`GUIDELINES.md`, se existirem. Preserve identidade, versões e componentes do projeto. Não crie uma etapa obrigatória de aprovação para ajustes já solicitados.
- Identifique as rotas, seções, diálogos e componentes compartilhados do recorte. Para “todas as páginas do módulo”, registre uma matriz pequena de telas e estados; uma captura do detalhe não valida cadastro, listagem ou edição.
- Se o módulo estiver ambíguo, explicite a interpretação pelo contexto e continue o que independe da resposta. Não expanda a revisão para todo o sistema sem autorização.
- Pedido somente de análise produz diagnóstico; pedido de melhorar/corrigir inclui implementação e nova inspeção. Não faça deploy, migração, mudança de permissões ou exclusão de dados como parte de compactação visual.

## Navegador e evidência obrigatórios

1. Use o navegador real pelas ferramentas disponíveis e autorizadas na sessão. Leia sua documentação antes de operar; não prescreva um driver incompatível com o ambiente.
2. Abra a página correta e confira a conta/contexto. Evite recarregar abas com formulários do usuário; prefira uma aba de teste. Não altere dados reais só para preencher screenshots.
3. **Capture e examine um print antes de editar.** Use a imagem enviada pelo usuário como evidência adicional, mas reproduza o estado atual quando possível. Snapshot textual, código, lint e build não substituem inspeção visual.
4. No mobile, confira uma largura estreita e uma típica (por exemplo, 360 e 390 px); cubra também o breakpoint afetado e um desktop. Ajuste a matriz ao projeto. Para componente compartilhado, verifique consumidores representativos e variantes afetadas.
5. Faça prints de viewport para julgar densidade e alinhamento; complemente com página inteira quando necessário. Inspecione DOM e dimensões para explicar um problema visto na imagem: padding acumulado, linha vazia, largura mínima, quebra de ações ou overflow.
6. Salve antes/depois em `docs/plans/<data>-<recorte>-compact-review/` quando a ferramenta permitir exportar. Use nomes com tela, estado e largura. Se não houver exportação, apresente as capturas disponíveis e declare a limitação; não invente caminhos.

Sem navegador, URL ou sessão utilizável, faça apenas o trabalho independente disponível e informe o bloqueio. Não conclua que a revisão visual foi validada sem abrir e observar a interface.

## Diagnóstico que orienta a correção

Registre achados concretos: **local → causa → ajuste → verificação**. Priorize o que reduz esforço de leitura ou operação.

- **Cabeçalhos:** identificação e ações devem compartilhar a mesma faixa quando couberem. Uma linha inteira para editar/menu costuma criar vazio; prefira ações secundárias discretas ao lado do nome. Remova duplicação de informação, não dados úteis.
- **Margens:** procure padding duplicado de página, seção, card e formulário. Corrija no nível responsável, preservando respiro entre grupos. Não reduza todos os espaços indiscriminadamente.
- **Simetria:** alinhe bordas, rótulos, valores e ações por uma grade consistente. Use duas colunas para dados curtos relacionados, como cidade/UF; nomes, e-mails e descrições longos precisam de espaço. Não force colunas iguais, alturas fixas ou truncamento para simular alinhamento.
- **Tabelas mobile:** quando colunas deixarem a leitura apertada, use linhas/cards com hierarquia, rótulos e ações explícitas. Preserve filtros, ordenação, seleção, totais, paginação, estado vazio, carregamento e erro. Mantenha tabela no desktop quando ela facilitar comparação.
- **Formulários:** preserve labels, ajuda necessária, erros e fluxo de teclado. Remova larguras mínimas que excedem a tela. Distribua ações sem cortar texto; teste teclado móvel e rolagem do diálogo quando disponíveis.
- **Ações:** se Material Design 3 for solicitado ou já adotado, use a hierarquia de superfícies e estados do projeto. Edição secundária pode ser tonal/texto, com símbolo menor; reserve botão preenchido para a ação principal. Diferencie tamanho visual e área interativa: mantenha alvo confortável, em geral 44–48 px, com nome acessível e foco visível. Margem vazia não aumenta a área clicável.
- **Conteúdo:** teste textos longos e ausência de mídia. Não transforme espaço útil para leitura em aperto, nem use fotos, ícones ou skeletons grandes para ocupar buracos.

## Implementar e conferir

Trabalhe por família de componentes ou rota, com alterações pequenas e verificáveis. Reutilize primitives existentes. Se a mudança é só de uma página, use escopo local ou uma variante sem alterar consumidores não revisados. Evite cadeias de overrides e `!important` espalhados para encobrir a causa.

Depois de cada ajuste relevante:

- Reabra o mesmo estado com os mesmos dados e largura e **capture outro print**. Compare visualmente: altura, alinhamento, legibilidade, proporção do ícone e distribuição das ações. Uma redução numérica de altura não basta.
- Clique em editar/menu, abra e cancele diálogos, siga detalhes e volte, confira filtros/paginação afetados. Para ações destrutivas ou envio, use fixtures autorizadas ou valide até a confirmação sem executar.
- Verifique overflow real, texto e botões cortados, foco, áreas de toque, conteúdo longo e estados vazio/carregando/erro relevantes. Não esconda overflow para disfarçar conteúdo inacessível.
- Confira desktop após o mobile; restaure o viewport e feche apenas abas de teste. Não deixe alterações de formulário salvas só por causa da revisão.
- Execute lint/build e testes proporcionais ao que mudou. Para novas interações ou troca tabela/card, cubra preservação de eventos e navegação. Evite testes que apenas conferem classes ou copiam o CSS. Não rode build e testes em paralelo se disputarem artefatos gerados do projeto.

Se o print ainda mostrar o problema, corrija e repita a comparação. Pare quando os achados do recorte estiverem resolvidos ou houver um impedimento concreto; não inicie um redesign sem fim.

## Entrega

Resuma telas/componentes alterados, larguras e interações realmente verificadas, prints antes/depois e limitações. Diferencie local de produção. Quando houver matriz de módulo, marque cada tela como verificada, apenas inspecionada em código ou bloqueada. Não declare “todas as páginas revisadas” por ter ajustado apenas um componente compartilhado.
