# Estilo padrão do documento final

Referência visual aprovada pelo usuário: `/var/www/amazoniaseguros.com.br/output/pdf/proposta-clausulados-amazonia-seguros-nimbou.pdf`. Medidas e cores conferidas no PDF e em seu gerador `docs/comercial/clausulados-amazonia/gerar_pdf.py`, em 2026-11-14. Este perfil é autossuficiente: não dependa desses caminhos na execução da skill.

## Identidade e composição

- A4 vertical, 595,28 × 841,89 pt, fundo branco, margens laterais de 43 pt (aproximadamente 15,2 mm), coluna útil de 509,28 pt.
- Cabeçalho em todas as páginas: faixa azul-marinho de 84 pt de altura, de borda a borda. Marca Nimbou à esquerda, identificação do cliente e linha com responsável, prestador e data à direita, em azul claro.
- Use o [logo vetorial Nimbou](../assets/nimbou-logo.svg) quando a proposta for da Nimbou. Largura de 116 pt, preservando a proporção, alinhado à margem esquerda; base a 53 pt do topo. A identificação do cliente fica a 34 pt do topo e a segunda linha a 49 pt, alinhadas à margem direita. Não substituir a marca por uma imitação textual nem transportar a marca Nimbou para outro prestador.
- Abaixo da faixa, rótulo da parte em azul e caixa alta, a 108 pt do topo; título principal a partir de 124 pt do topo. Medir sua altura antes de posicionar o restante. Não criar capa isolada: a primeira página já apresenta objetivo, recomendação e benefícios.
- Rodapé discreto: filete `#d5dfeb` a 37 pt da base; prestador, assunto abreviado e versão à esquerda, `página / total` à direita, na linha a 24 pt da base. Reservar pelo menos 52 pt até a base para o conteúdo.
- Respiro entre blocos; agrupar conteúdo por assunto, com um título informativo por página e seções numeradas. A referência tem 15 páginas; o tamanho do novo documento depende do conteúdo, sem preencher páginas para imitar esse total.

## Cores e tipografia

| Uso | Especificação |
|---|---|
| Texto principal e faixa de cabeçalho | `#14263c` |
| Seções e destaques | `#296cb5` |
| Cards suaves | `#edf2f9` |
| Texto no cabeçalho e filetes de tabela | `#a9c7e8` |
| Notas e rodapé | `#4d6177` |
| Cabeçalho de tabela | `#dce8f5` |
| Linhas alternadas de tabela | `#f3f6fa` e branco |

Família: **Lato Regular e Lato Bold**, incorporadas no PDF. No ambiente de referência estão em `/usr/share/fonts/truetype/lato/`. Verifique a disponibilidade; se faltar, localize/instale a família ou declare uma substituição próxima, sem afirmar fidelidade exata. Não vincule a skill a um caminho de fonte obrigatório.

| Elemento | Corpo / entrelinha em pt |
|---|---|
| Título da página, bold | 19,5 / 24 |
| Subtítulo de abertura, bold | 16 / 21 |
| Seção numerada, bold, azul | 12,8 / 17 |
| Parágrafo | 10,2 / 14,4 |
| Célula de tabela | 9,5 / 13 |
| Cabeçalho de tabela, bold | 9,5 / 13 |
| Nota | 8,5 / 11,5 |
| Rótulo superior, bold | 8 |
| Cliente no cabeçalho | 8 |
| Identificação secundária e rodapé | 7,5 |

Após parágrafos, aproximadamente 10 pt; após seções, 12 pt; após tabelas, 14 pt. Ajuste quebras, sem reduzir o corpo para encaixar excesso de conteúdo.

## Tabelas e elementos visuais

- Tabelas ocupam a coluna útil, sem grade vertical ou contorno pesado; alinhamento superior, quebra de texto, 10 pt de padding lateral e 8 pt vertical. Cabeçalho azul claro, filete inferior de 0,6 pt e linhas alternadas suaves. Em duas colunas, comece com proporção 30/70 e ajuste ao conteúdo.
- Repetir cabeçalho em continuação de tabela. Não separar título de seu conteúdo nem cortar uma linha entre páginas; quando uma linha for maior que a área útil, reorganizar o texto.
- Cards de síntese: fundo suave, cantos de 9 pt, altura inicial de 60 pt, legenda azul e valor em navy/bold. Usar apenas dados confirmados ou pendências claramente identificadas.
- Fluxos curtos: blocos arredondados com número e legenda, ligados por traços azuis. Usar navy e texto branco somente para uma etapa com destaque semântico; não marcar automaticamente a terceira etapa como ativa. Se necessário, usar todos neutros.
- Diagramas vetoriais simples apenas quando facilitarem a decisão. Não reproduzir arquitetura, cronograma, requisitos ou apêndices da referência se não forem úteis ao caso.

## Conteúdo e validação

Use títulos orientados a resultado, texto objetivo e tabelas que relacionem entrega a benefício ou responsabilidade. A organização visual serve à lógica da proposta e ao modelo mensal definido na skill. Não transportar nomes, números, escopo, preço, cláusulas ou informações da Amazônia para outra oportunidade. Personalizar cliente, assunto, data, versão e rótulos em todas as páginas.

Entregar PDF e conteúdo editável coerentes. Guardar persona, simulação, respostas do autor e feedback em arquivos internos separados, sem apêndice automático no PDF do cliente.

Renderizar **todas** as páginas e conferir visualmente: fontes e logo, cabeçalho/rodapé, alinhamentos, legibilidade, caracteres portugueses, tabelas, quebras, ausência de sobreposição e campos cortados. Conferir paginação, metadados e dados comerciais contra a fonte editável. Medir alturas antes de desenhar; se ultrapassar a área útil, paginar novamente. Um PDF gerado sem erro não basta como validação visual.
