# Comparações e critérios de leitura

## Métricas

Calcule sobre o mesmo recorte de conta, campanha, rede, datas e ação:

| Indicador | Cálculo |
|---|---|
| CTR | soma dos cliques gerais / soma das impressões |
| CPC | soma do gasto / soma dos cliques gerais |
| Eventos da ação por clique | soma dos eventos daquela ação / soma dos cliques gerais |
| Custo por ação | soma do gasto no recorte / soma dos eventos daquela ação |
| Volume por dia investido | soma do volume / quantidade de datas com gasto > 0 |
| Gasto por dia investido | soma do gasto / quantidade de datas com gasto > 0 |

Multiplique taxas por 100 para porcentagens; para variação relativa use (novo / anterior - 1) × 100. Diferenças de CTR são também pontos percentuais. Não faça média simples dos CTRs, CPCs ou custos por conversão diários. Denominador zero resulta em “não calculável”, não em zero.

Eventos de WhatsApp por cliques gerais não são taxa por sessão da landing page. Conversões atribuídas após visualizações ou outras interações podem não corresponder a um clique do recorte; quando isso ocorrer, rotule o quociente como indicador descritivo, sem alegar uma probabilidade exata de um clique converter. Se não houver separação de cliques de destino, não invente esse denominador.

O custo por evento de WhatsApp usa todo o gasto do recorte compatível, não apenas gasto de linhas que converteram. Não repita esse gasto e depois some custos por ação. Sem CRM, não chame evento de lead único, conversa recebida ou locação. Ao usar ações sobrepostas, preserve as séries separadas.

## Dias, semanas do mês e meses

- Dia do mês: compare a mesma data ordinal em meses diferentes, reportando gasto, cliques, CTR, CPC, ações por tipo e exposição. Pode haver efeito de dia da semana e feriados.
- Semanas do mês: 1-7, 8-14, 15-21, 22-28 e 29-fim. Não confunda com segunda-domingo do relatório semanal. A última faixa tem tamanho variável, então use médias por dia investido.
- Mês: para volumes e gastos use média por dia investido; para taxas use razão das somas dos dias investidos. Informe quantidade de dias e se o mês está parcial. CTR de campanha com gasto zero em algumas datas não deve ganhar zeros artificiais por essas datas.
- Dias com tráfego e custo zero merecem análise técnica à parte; exclusão por gasto positivo é uma convenção do recorte histórico solicitado, não motivo para ocultar entrega gratuita ou atraso de contabilização.

## Ajuste ao movimento do período: seis dias antes e depois

Para cada data d, selecione as datas de d-6 até d+6, excluindo d e as datas sem investimento. Não substitua seis dias de calendário por seis dias ativos mais distantes.

1. CTR_dia = cliques_d / impressões_d.
2. CTR_entorno = soma cliques_vizinhos / soma impressões_vizinhas.
3. Índice local = CTR_dia / CTR_entorno; 1,00 = igual ao entorno, 1,20 = 20% acima.

Não use média dos CTRs vizinhos nem CTR do mês. Não inclua o dia focal no denominador. Se faltarem datas futuras ou a extração não cobrir a janela, mostre cobertura e trate o índice como provisório; não invente os seis dias seguintes. Se houver pouco tráfego ou mudança estrutural dentro da janela, sinalize a fragilidade. Índices locais são descritivos e janelas vizinhas se sobrepõem.

Exemplo: dia A com 20/100 tem CTR 20%; entorno 60/600 = 10%; índice 2,00. Dia B com 18/100 tem CTR 18%; entorno 120/600 = 20%; índice 0,90. O dia A se destacou no próprio entorno e B ficou abaixo; comparar só meses pode esconder isso.

## Dias 30 a 5

A faixa inclui 30 e 31 quando existentes e 1 a 5 do mês seguinte. Dia 29 de fevereiro não vira dia 30. Compare com os demais dias de investimento em gasto/dia, cliques/dia, contatos/dia por tipo, CTR, CPC e custo por ação. Evite duplo agrupamento de datas e controle alterações de meta, orçamento, canal, dias da semana e saldo. Exija repetição em ciclos comparáveis para afirmar destaque recorrente; uma taxa alta com poucos cliques não basta.

## Decisão semanal

Um CPC menor com conversões por clique piores pode encarecer o contato. Um CTR menor com mais contatos por dia pode ainda ser útil. Dê preferência a volume sustentável de contatos eficientes e qualidade confirmada, não a uma única taxa. Separe dado observado, interpretação e hipótese de teste.
