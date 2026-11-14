# Simulação da leitura e revisão

Este protocolo é uma adaptação da biblioteca. Gera hipóteses úteis para revisão, sem representar a reação real do cliente.

## Preparar três pacotes

**Autor:** materiais completos, registro de evidências, limites privados do prestador e proposta versionada.

**Comprador:** persona com fatos e falas conhecidos do próprio cliente; contexto de compra compartilhado; somente o trecho já liberado da proposta. Não incluir notas privadas, estratégia de persuasão, respostas do autor, texto futuro ou a instrução de chegar à aprovação. Informações insuficientes geram perguntas, não características psicológicas inventadas.

**Revisor:** todos os materiais e versões, reações do comprador e respostas do autor. Seu trabalho é verificar fundamentação, clareza, coerência comercial e correções; não atuar como segundo vendedor.

Monte a persona a partir de cargo, responsabilidade, objetivo declarado, conhecimento técnico demonstrado, critérios de decisão conhecidos e objeções registradas. Inclua fontes e lacunas. Idade, estilo decisório, receios e orçamento não informados permanecem desconhecidos. Não inferir traços pessoais pelo segmento ou cargo. Hipóteses opcionais devem ser rotuladas e testadas separadamente, sem virar fatos.

## Execução com agentes Codex

Quando houver autorização para agentes, despache comprador e revisor em contextos novos (`fork_turns: "none"`). Use `gpt-6-sol` com raciocínio `medium` para ambos, pois há julgamento aberto. O controlador pode assumir o autor. Não atribuir personalidade a um modelo como se ela fosse evidência sobre o cliente.

O comprador não deve ler o diretório da oportunidade: envie os fatos selecionados e as seções progressivamente pelo controlador. Restrinja-o a esses conteúdos, sem ferramentas, fontes externas ou acesso a arquivos. Não passar o caminho de notas privadas ou da proposta completa. A separação de pacotes reduz contaminação, mas não constitui garantia técnica de isolamento de dados.

Mensagem inicial sugerida:

> Você simula um único decisor para levantar hipóteses de revisão. Use apenas os fatos da persona fornecida e os trechos recebidos. Não consulte ferramentas nem arquivos. Não invente características, orçamento ou preferências. Não tente aprovar a proposta. Para cada trecho registre entendimento, valor percebido, dúvida/objeção, trecho que a provocou e informação necessária. Não há texto futuro disponível. Rotule suas reações como simulação.

Se agentes não estiverem disponíveis ou autorizados, use os mesmos pacotes em passagens explícitas por papéis. Informe que o mesmo contexto foi usado e que a leitura não é independente.

## Primeira leitura progressiva

Congele a versão inicial. Envie uma seção de cada vez, na ordem do documento, acumulando apenas as seções anteriores. Registre a primeira reação antes de liberar a próxima. O comprador pode dizer “ainda não informado” e verificar adiante se a proposta esclarece o ponto. Não tratar toda dúvida antecipada como defeito definitivo.

Preserve as reações originais. Ao final da leitura completa, marque quais dúvidas foram respondidas em seções posteriores e quais persistem. Evite espalhar feedback interno dentro do documento voltado ao cliente.

Identifique o texto efetivamente lido como V0 e a revisão como V1. Preserve V0 em arquivo interno ou registre os trechos originais dos achados; se não houver arquivos, basta mostrar os trechos necessários na análise. Não afirmar que uma dúvida foi resolvida por alteração sem mostrar o antes/depois ou apontar as versões salvas. Se a resposta já estava em V0, marque como esclarecida adiante, sem inventar uma mudança.

## Discussão e revisão

O autor responde às objeções persistentes. Classifique a resposta em:

- Correção de redação ou organização que pode ser aplicada agora.
- Evidência existente que precisa ser inserida ou melhor localizada.
- Decisão ou dado faltante do prestador.
- Informação a confirmar com o cliente.

O revisor identifica se a resposta está sustentada e se ela aparece na versão revisada. Uma boa explicação fora do documento não resolve uma proposta ambígua. Não transformar sugestão de preço, prazo, disponibilidade ou exclusão em condição acordada. Não esconder pendências para encerrar o diálogo.

Use até duas rodadas de discussão e revisão após a leitura inicial. Encerre antes se os pontos materiais estiverem corrigidos ou classificados com destinatário. Ao atingir o limite, entregue as pendências; não force consenso. Nova evidência material permite uma revisão posterior.

## Registro por seção

Use uma linha por achado relevante, incluindo dúvida já respondida adiante quando isso ajudar a avaliar a sequência:

| Seção/versão e trecho | Entendimento e valor percebido | Dúvida ou objeção simulada | Evidência e estado | Ação/alteração | Destinatário e situação |
|---|---|---|---|---|---|

Identifique achados como A1, A2 etc. Na versão revisada, indique quais alterações atendem a cada achado. Estados úteis: resolvido no texto, esclarecido adiante, pendente do prestador, pendente do cliente. Não atribuir nota de conversão ou percentual de aprovação.

## Separação da entrega

- **Proposta:** texto legível pelo cliente, com pendências claramente sinalizadas quando for rascunho.
- **Análise interna:** feedback por seção, síntese da discussão, alterações e dúvidas com destinatários.
- **Persona:** fatos utilizados, fontes, hipóteses e lacunas.

Promessas sem base, condições materiais indefinidas ou contradições impedem declarar a proposta pronta para envio. Discordância simulada pode permanecer quando a oferta não resolve uma necessidade; não reescrever apenas para obter aprovação do agente.
