# Estilo do documento final

Perfil Nimbou atualizado após aprovação da capa tecnológica e do miolo comercial leve, em 2026-11-14. Este perfil e os assets são autossuficientes; não dependem de documentos ou caminhos do cliente que originou a referência. Uma referência fornecida ou um visual aprovado na oportunidade prevalece sobre o padrão.

## Composição

- A4 vertical, 595,28 × 841,89 pt. Para uma proposta completa, usar capa separada e miolo branco. Em revisão pontual, apresentação em conversa ou formato diferente solicitado, adaptar sem impor capa.
- Título explícito de proposta, subtítulo curto, cliente, prestador e data. Não antecipar honorários, vigência ou parcelas na capa e na apresentação, salvo pedido diferente.
- Miolo com margens laterais de 60 pt, coluna útil de 475,28 pt; seções numeradas e informativas. Listas curtas com início em negrito e tabelas para escopo, responsabilidades e investimento. Agrupar seções sem criar uma página por título.
- Cabeçalho discreto: logo Nimbou de 128 pt à direita, base a 61 pt do topo; filete a 71 pt do topo. Começar conteúdo abaixo de 78 pt. Não repetir uma faixa escura grande em todas as páginas.
- Rodapé interno: filete a 43 pt da base; prestador, cliente e “Página X de Y” centralizados a 29 pt da base, em azul acinzentado. Reservar ao menos 57 pt para o conteúdo.

## Capa moderna e tecnológica

O ponto focal é a marca, com hierarquia e contraste. Evitar a aparência de relatório técnico ou de anúncio genérico de IA.

- Fundo azul profundo `#081b30`, título branco, subtítulo `#c1d2e4`, acentos `#80b6eb` e `#398be0`.
- [Logo oficial Nimbou](../assets/nimbou-logo.svg) claro no alto à esquerda, cerca de 147 pt; identificação discreta de proposta/ano no alto à direita. Filete suave `#23425f` sob o cabeçalho.
- Título à esquerda em duas linhas de destaque, cerca de 39 pt; prefixo “Proposta de” menor, 19 pt. Subtítulo em 12,5/18 pt, sem exceder a área de leitura.
- [Símbolo original](../assets/nimbou-simbolo.svg) ampliado no quadrante inferior direito, com recorte intencional na borda. Manter a geometria, proporção e reconhecimento da marca; usar contraste suficiente para os pontos permanecerem visíveis.
- Círculos tonais e poucas linhas finas de conexão podem sugerir tecnologia. Conter a decoração fora dos textos; preservar respiro. Destinatário no canto inferior esquerdo, data e prestador na base.
- O helper [draw_cover.py](../scripts/draw_cover.py) desenha esse perfil em vetor e recebe dados da oportunidade. Use-o quando gerar com ReportLab; registre as fontes antes da chamada. Ele não cria páginas, salva o PDF nem insere dados de cliente por conta própria. Outras ferramentas podem reproduzir a composição.

Use assets da própria marca. O perfil Nimbou só se aplica a propostas da Nimbou; para outro prestador, use sua identidade. Não redesenhar logo com texto, círculos aproximados ou IA. Vetores existentes preservam nitidez e fidelidade. Imagegen é opcional quando uma ilustração ou textura nova realmente ajudar; inspecione e salve o asset no projeto. O título e as condições devem continuar como texto legível no PDF.

Não usar robôs, cérebros, circuitos densos ou brilhos excessivos apenas para sinalizar IA. Se outra referência exigir ondas ou faixas, desenhar formas fechadas contínuas até as bordas, sem traços abertos com pontas expostas, cruzamentos acidentais ou recortes defeituosos. Não recolocar ondas na capa tecnológica já aprovada.

## Miolo: cores e tipografia

Família de referência: **Lato Regular e Lato Bold**, incorporadas no PDF. Localize as fontes no ambiente; se indisponíveis, escolha substituição próxima e confira a diagramação. O caminho de fontes não é requisito da skill.

| Elemento | Corpo / entrelinha | Cor |
| --- | --- | --- |
| Seção numerada, bold | 13,3 / 16,5 pt | `#10314e` |
| Parágrafo e lista | 9,8 / 13,4 pt | `#414141` |
| Célula de tabela | 9 / 12 pt | `#414141` |
| Cabeçalho de tabela, bold | 9 / 12 pt | Branco sobre `#10314e` |
| Nota | 8 / 10,7 pt | `#63798c` |
| Rodapé | 7,3 pt | `#839bb0` |

Filete azul `#216db2` sob cada seção. Espaços típicos: 7 pt após parágrafo, 9 pt após tabela e 13 pt entre filete de seção e texto. Ajustar à densidade, sem diminuir fontes para encaixar excesso de conteúdo.

Tabelas na largura da coluna, com quebra de texto e alinhamento superior; padding de 6 pt nas laterais e 5 pt no topo/base. Cabeçalho navy, linhas alternadas branco/`#eaf1f6`, grade fina `#bfd0df`. A primeira coluna pode usar negrito; não destacar parágrafos inteiros sem necessidade. Em duas colunas, começar em 32/68 e ajustar ao conteúdo.

Repetir o cabeçalho em continuações; não cortar linhas ou deixar títulos separados de seu conteúdo. Cards e diagramas são opcionais: use apenas quando esclarecem a oferta e sem destacar automaticamente uma etapa do fluxo.

## Conferência

Entregar PDF e fonte editável coerentes. Personalizar nomes, contatos, datas, versão e metadados; não copiar condições da referência. Manter persona, simulação e notas privadas em arquivos separados, sem apêndice automático no PDF comercial.

Ao criar ou reorganizar o documento, renderizar todas as páginas e inspecionar: marca, contrastes, hierarquia, margens, listas, tabelas, caracteres portugueses, paginação e cortes. Conferir números e condições contra a fonte.

Em alteração pontual, renderizar e inspecionar as páginas afetadas; comprovar a preservação das demais por comparação de imagens ou conferência equivalente. Uma mensagem de sucesso do gerador não substitui o exame do PDF. O elogio ou a aprovação da capa fixa aquele visual na oportunidade, sem representar aceite das condições comerciais.
