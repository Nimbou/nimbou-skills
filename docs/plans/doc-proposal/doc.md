# Proposta de assessoria — desenho e validação

Data: 2026-11-14. Escopo aprovado na conversa: criar skill para propostas de assessoria mensal com diagnóstico, priorização conjunta e execução em marketing, processos, gestão, automação, IA, skills, sistemas e ferramentas. Um único decisor; conversas e materiais como entrada; um objetivo de melhoria ativo por vez, dividido em entregas menores. Capacidade concreta e demais condições são definidas para cada oportunidade.

## Implementação

- `plugins/nimbou-skills/skills/doc-proposal/SKILL.md`: investigação, oferta, proposta, revisão e entrega.
- `reference/fundamentos.md`: conceitos documentados, fontes, edição consultada e adaptações locais.
- `reference/simulacao.md`: persona, pacotes por papel, leitura progressiva, revisão e registro de alterações.
- README: descoberta e exemplo de uso. A distribuição existente enumera automaticamente as pastas de skills; não foi necessário mudar o bootstrap.

Fontes: capítulo acessível da segunda edição de Tom Sant e apresentação do autor; descrição oficial do SPIN pela Huthwaite; páginas públicas de Cialdini/Influence at Work. Não houve consulta integral dos três livros. URLs e limites de atribuição estão na referência da skill. O protocolo de agentes é uma adaptação própria, sem alegação de eficácia comprovada ou previsão de compra.

## Teste comportamental inicial, sem skill

Executado por `gpt-6-sol`/`medium`, contexto novo, sem fontes externas nem alteração de arquivos.

Cenário: Ana, proprietária de pequena empresa, três pessoas, WhatsApp e planilha; contatos sem responsável claro e desejo de visibilidade sem ferramenta complicada. Não há linha de base, mensalidade, capacidade, cadência ou condições. Prestador tem disponibilidade privada às terças e quintas e não deve assumir emergência. Pedido: proposta preliminar e simulação por seção, sem entrevista longa.

Observação: o agente evitou metas inventadas e levantou condições faltantes; esses comportamentos já existiam sem a skill. A lacuna observada foi o feedback misturado à proposta, sem revisão rastreável ou arbitragem de um revisor. Exemplo literal: “Leitura simulada de Ana: ‘Entendi que haverá execução. Gostaria de ver um exemplo de entrega do primeiro mês e saber quem atualiza os registros.’” A dúvida ficou sem alteração demonstrada.

## Mesmo cenário, com skill

Outro agente `gpt-6-sol`/`medium`, contexto novo, leu a skill e as referências, sem subagentes nem fontes externas. A aplicação testou o modo por papéis no mesmo contexto; não validou isolamento independente entre comprador e autor.

Resultado: proposta separada da análise, persona com desconhecidos, achados A1–A4, destinatário das pendências e estado “rascunho com pendências”. Não inventou mensalidade, capacidade nem meta comercial. Declarou explicitamente a ausência de isolamento independente. A nota de terças e quintas apareceu apenas na orientação interna ao prestador.

Lacuna encontrada: relatou correções sem exibir V0 e V1. Exemplo literal: “O autor incluiu a observação do caminho do contato no primeiro ciclo.” Não havia antes/depois para verificar a alegação. Refinamento aplicado: preservar V0 ou seus trechos; identificar V1; demonstrar alterações; distinguir dúvida esclarecida adiante de mudança efetiva.

## Teste após refinamento: revisão pontual

Terceiro agente `gpt-6-sol`/`medium`, contexto novo, leu a skill atualizada. Entrada V0 com escopo ilimitado, tecnologia sem justificativa, aumento de vendas de 40% sem evidência, retorno rápido sem dados e escassez de vagas não confirmada. O contexto manteve valor e capacidade indefinidos; o prestador não assume urgências, mas não formalizou as condições.

Resultado: entregou V1 das duas seções solicitadas e análise separada com A1–A5, trechos originais e destinação das pendências. Retirou as cinco afirmações sem fundamento, propôs estabelecer linha de base, preservou a primeira frente como sugestão e manteve valor, capacidade, encontros e atendimento em aberto. Não transformou a nota privada de urgências em condição acordada. Declarou uso do mesmo contexto e estado de rascunho. Não houve alegação de envio ou aceite. A revisão pontual ficou dentro do escopo pedido.

Exemplo verificável: V0, “aumentar suas vendas em 40%”; V1, “O diagnóstico inicial também permitirá estabelecer uma linha de base antes de definir metas numéricas.”

## Verificação técnica

- `python3 /home/everton/.codex/skills/.system/skill-creator/scripts/quick_validate.py plugins/nimbou-skills/skills/doc-proposal`: aprovado.
- Resolução dos links Markdown locais da nova skill: aprovada.
- `git diff --check`: aprovado.
- `node --test tests/plugin/plugin-manifest.test.mjs`: 6 aprovados, 0 falhas.
- `npm test`: 60 testes, 59 aprovados, 1 falha preexistente. Em `tests/plugin/skill-tree.test.mjs:321`, a expressão `/route the change did NOT touch/i` não corresponde a `browser-smoke/SKILL.md`. Verificação do conteúdo via `git show HEAD:<arquivo>` confirmou que o arquivo atual é idêntico a HEAD e que a mesma expressão já não correspondia a HEAD. Não houve alteração desse arquivo ou teste nesta tarefa.

## Limites da validação

Os cenários são sintéticos; não demonstram impacto na conversão comercial. A primeira validação de negócio será aplicar a skill a materiais de uma oportunidade real e confrontar dúvidas simuladas com o retorno real do decisor. Não foram publicados arquivos nem criada PR.

## Estilo do documento final

O usuário definiu posteriormente o PDF `proposta-clausulados-amazonia-seguros-nimbou.pdf`, no projeto Amazônia, como referência de estilo. As páginas 1–3 foram renderizadas e inspecionadas; medidas, fontes e cores foram conferidas no gerador existente e na extração do PDF. O perfil autossuficiente está em `reference/estilo-documento.md`, com logo Nimbou vetorial em `assets/`. O PDF original e seus dados não são distribuídos na skill. O resultado final passa a ser PDF com fonte editável, salvo pedido diferente; rascunhos e revisões pontuais podem continuar na conversa.

Teste anterior à mudança: agente `gpt-6-sol`/`medium`, contexto novo, leu apenas a skill e as referências. Constatou ausência de regras visuais e de PDF padrão. Propôs Arial 11, margens de 20 mm e cores próprias, explicitando que eram escolhas suas. Isso demonstrou que a versão anterior não determinava o estilo pedido.

Teste com o novo perfil: outro agente `gpt-6-sol`/`medium`, contexto novo, gerou duas páginas sintéticas sem consultar o PDF original. Os artefatos estão em `style-reference/`: PDF, conteúdo JSON, código de geração e PNGs. Ambas as páginas foram inspecionadas visualmente: identidade, hierarquia, tabelas, margens e rodapé consistentes com a referência, sem cortes ou sobreposições. A extração com pdfplumber confirmou duas páginas, identificação do cliente, paginação, fontes Lato e limites laterais. O gerador verifica a altura do conteúdo e das tabelas contra a reserva de rodapé. A amostra mantém condições comerciais como “A definir com o prestador”.

Após a mudança: validação estrutural da skill, links locais, SVG sem referências externas, `git diff --check` e seis testes de empacotamento aprovados. A validação da amostra é visual e estrutural; não cobre todos os volumes possíveis de texto. Toda proposta futura ainda exige renderização e conferência próprias.

## Perfil vigente após a experiência da proposta real

O perfil acima foi substituído pelo refinamento registrado em [refinamento-proposta.md](refinamento-proposta.md): capa tecnológica com símbolo vetorial e miolo comercial leve, apresentação concisa, investimento no fechamento e detalhes do sistema em apêndice. Os artefatos em `style-reference/` foram atualizados para a nova amostra sintética de três páginas; as observações anteriores descrevem a validação histórica do perfil de duas páginas, disponível no histórico Git.
