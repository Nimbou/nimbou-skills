# Apresentação dos planos em tarefas

O formato de tarefas adota a identidade de [nimbou.com.br](https://nimbou.com.br/):
azul `#296CB5`, azul-marinho `#14263C`, texto secundário `#4D6177`, fundo
`#F7F9FD`, superfície `#EDF2F9` e destaque claro `#D8E8FC`.
O logo branco fica sobre fundo escuro. Archivo 600 é a fonte dos títulos;
Source Sans 3 400/600 é a fonte de leitura. Preserve a identidade solicitada
pelo usuário quando ela for diferente desse padrão.

Os recursos ficam em `assets/`: logo PNG transparente em alta resolução,
três fontes TTF e as respectivas licenças SIL Open Font License. Foram derivados
do logo e dos arquivos de fonte publicados pelo site em 20/10/2026. O gerador
incorpora as fontes no PDF e funciona sem rede, somente com ReportLab instalado.

Cada card tem duas colunas independentes, alinhadas pelo topo. Título, critério
de conclusão e subtarefas ficam inteiramente na coluna esquerda; responsável,
previsão e dependências ocupam chips na coluna direita. Um chip pode crescer
verticalmente para acomodar nome longo. A altura do card acompanha a maior
coluna. Não reserve a altura dos chips acima da descrição da tarefa.

Use superfícies planas claras, contornos suaves e cantos arredondados. Evite
tabelas com grade aparente e colunas vazias para cada metadado. A sequência de
fases e os limites são blocos visuais pequenos; os marcos começam diretamente,
sem legenda explicativa. As fases futuras continuam sem tarefas detalhadas.

A4 vertical é o padrão; mantenha a orientação já aprovada. Nunca force duas
páginas ou três marcos apenas para reproduzir um exemplo. O layout permite
continuação de cards longos e envolve texto extenso nos chips. Renderize e
confira o PDF antes de entregar: alinhamento pelo topo, contraste, quebras,
acentos, conteúdo completo, cabeçalhos e rodapés.

O ponto de entrada é `scripts/build_plan_pdf.py`; o layout de tarefas vive em
`scripts/task_plan_pdf.py`. Planos legados com `acoes[]` mantêm sua apresentação.
