# Schema do `plano.json`

## Formato de tarefas: fases completas

Novos planos de tarefas descrevem todas as fases acordadas. A hierarquia é
`fases[]` → marcos por ID → `marcos[].tarefas[]` → `subtarefas[]`. Os IDs
continuam estáveis para futura criação de tarefas; gerar os documentos não cria
tarefas externas nem inicia a execução.

```jsonc
{
  "id": "piloto-atendimento",
  "titulo": "Piloto de atendimento",
  "versao": 1,
  "data": "20/10/2026",
  "objetivo": {"frase": "Testar e avaliar o atendimento até 31/01/2027.", "prazo": "31/01/2027"},
  "ciclo": {"proxima_revisao": "27/10/2026"},
  "orientacao_execucao": "Use Codex ou Dot na preparação técnica; mantenha decisões com as pessoas responsáveis.",
  "observacao_prazos": "As datas intermediárias são previsões ajustáveis.",
  "fases": [
    {"id": "preparar", "nome": "Prepare o atendimento", "periodo": "Até novembro", "marcos": ["ambiente-pronto"]},
    {"id": "avaliar", "nome": "Avalie o uso real", "periodo": "Após a preparação", "marcos": ["avaliacao-pronta"]}
  ],
  "marcos": [
    {
      "id": "ambiente-pronto",
      "fase_id": "preparar",
      "nome": "Ambiente pronto para o teste",
      "resultado_verificavel": "Acesso e dados conferidos.",
      "prazo": "30/10/2026",
      "tarefas": [{
        "id": "verificar-ambiente",
        "titulo": "Verifique o ambiente de teste.",
        "responsavel": "DONO A DEFINIR (TI)",
        "executor": "Codex ou Dot",
        "prazo": "30/10/2026",
        "depende_de": [],
        "concluida_quando": "Acesso e dados conferidos com evidências.",
        "subtarefas": ["Prepare dados fictícios.", "Teste os acessos previstos.", "Registre os impedimentos."],
        "insumos": ["Registro da implementação"],
        "entregaveis": ["Relatório de prontidão"]
      }]
    },
    {
      "id": "avaliacao-pronta",
      "fase_id": "avaliar",
      "nome": "Avaliação registrada",
      "resultado_verificavel": "As pessoas responsáveis avaliaram o uso.",
      "tarefas": [{
        "id": "avaliar-uso",
        "titulo": "Registre a avaliação do uso.",
        "responsavel": "DONO A DEFINIR (coordenação)",
        "executor": "Participação humana",
        "prazo": "Até 31/01/2027",
        "depende_de": ["verificar-ambiente"],
        "concluida_quando": "A avaliação contém os problemas e o encaminhamento.",
        "subtarefas": ["Confira os resultados reais.", "Registre a decisão e os próximos ajustes."],
        "recorrencia": "Repita ao final de cada período combinado."
      }]
    }
  ],
  "limites": ["O sistema atual continua oficial durante o teste."],
  "gatilhos_ajuste": ["Se um erro impedir o uso, registre e corrija antes da retomada."]
}
```

`fases[].id` e `marcos[].id` são únicos. Cada marco pertence a exatamente uma
fase: `marcos[].fase_id` corresponde à fase que o relaciona em `marcos[]`.
As listas de fases/marcos determinam a ordem; a lista plana `marcos[]` segue
essa mesma ordem. O gerador rejeita marcos ausentes, repetidos, fora da fase ou
fora da sequência declarada.

`depende_de` referencia IDs de tarefas anteriores do mesmo plano, inclusive
entre fases. Não crie ciclos ou dependências só porque tarefas aparecem em
sequência. Subtarefas não têm responsável separado: se isso for necessário,
promova-as a tarefas independentes.

`responsavel` é a pessoa que responde pela tarefa; `executor` identifica quem
ou qual ferramenta executa. Não confunda a ferramenta com o dono humano.
`recorrencia` descreve uma repetição real, não cria agendamentos.
`insumos` e `entregaveis` são listas opcionais e aparecem no Markdown.
`orientacao_execucao` e `observacao_prazos` são notas opcionais curtas.
Datas e nomes do exemplo não viram padrão para outros planos.

O comando de geração produz PDF e Markdown com o mesmo nome-base. O PDF
mostra fases, marcos, tarefas, subtarefas, critérios, recorrências e chips de
responsável/executor/previsão/dependências. O Markdown mantém também IDs,
insumos e entregas, para orientar a execução futura.

## Compatibilidade com planos de tarefas anteriores

Planos sem `fases[]` continuam sendo gerados a partir de `marcos[].tarefas[]`.
Nos antigos planos com `fase_atual_nome` e `fases_futuras[]`, estas últimas
preservam o resumo de `nome`, `periodo` e `marcos_previstos[]`; dependências
desses marcos apontam para tarefas conhecidas. Novos planos não usam esse resumo
para substituir o detalhamento de uma fase já acordada.

No PDF de tarefas, `escopo`, 5W2H, primeira ação, PDCA, riscos e backlog não
aparecem só por existirem. Limites e gatilhos úteis permanecem visíveis.
Não há legenda genérica antes dos marcos. Cards comuns ficam inteiros; somente
tarefas maiores que uma página permitem continuação.

## Formato legado de ações

Campos ausentes são omitidos do PDF (nada quebra), mas `titulo`, `objetivo`, `ciclo` e `marcos` são o mínimo útil. `escopo` e `fases_futuras` só entram em plano grande/programa.

IDs operacionais são opcionais para geração do PDF: `id` do plano, de cada marco
e de cada ação. Quando presentes, são únicos/estáveis e continuam iguais entre
ciclos e reordenações. Para executar um plano legado sem IDs, registre o mapeamento
no `execucao.json`, separado do conteúdo de gestão. Chats, automação, tarefas FAEPEN,
autorizações e evidências seguem o
[registro compartilhado](../../roadmap-orchestration/references/execution-record.md).
O gerador de PDF e `plan-summary` continuam consumindo os campos existentes.

```jsonc
{
  "id": "cadastro-fornecedores",      // opcional; identidade estável do plano
  "titulo": "string — nome do plano",
  "versao": 1,                        // inteiro; v2+ ativa a seção Check/Act
  "data": "13/07/2026",               // data de emissão; default = hoje
  "responsavel_geral": "Nome Sobrenome",

  "escopo": {                         // opcional; presente em plano grande/programa
    "porte": "pequeno | médio | grande | programa",
    "horizonte": "string — ex.: '6-12 meses, 3 fases'",
    "fase_ativa": "string — qual fase o bloco 'marcos' abaixo detalha"
  },

  "objetivo": {
    "frase": "string — o resultado em 1 frase",
    "indicador": "string — o que medimos",
    "meta": "string — de X para Y",
    "prazo": "30/09/2026",
    "por_que_agora": "string (opcional)",
    "custo_da_inacao": "string (opcional)"
  },

  "ciclo": {
    "inicio": "14/07/2026",
    "fim": "30/09/2026",
    "cadencia_revisao": "Quinzenal, terças 10h",
    "proxima_revisao": "28/07/2026"   // obrigatório: sem isso o plano não é um ciclo
  },

  // Marcos da FASE ATIVA — só estes recebem 5W2H completo e ação de 48h.
  "marcos": [
    {
      "id": "diagnostico",             // opcional; identidade estável do marco
      "nome": "string — estado do mundo, não esforço",
      "resultado_verificavel": "string — como se sabe que aconteceu",
      "indicador": "string (opcional)",
      "prazo": "15/08/2026",
      "acao_48h": "string — menor ação física que quebra a inércia",
      "acoes": [
        {
          "id": "conferir-registros",  // opcional; identidade estável da ação
          "o_que": "verbo físico + objeto verificável",
          "por_que": "a qual marco/indicador serve",
          "quem": "Um Nome Próprio (ou 'DONO A DEFINIR')",
          "quando": "22/07/2026",
          "onde": "sistema / sala / canal",
          "como": "passo-a-passo em 1 linha",
          "quanto": "R$ 0 / 4h de trabalho",
          "criterio_conclusao": "como se sabe que acabou",
          "status": "Pendente | Em andamento | Concluída | Cancelada"  // opcional, útil na v2+
        }
      ]
    }
  ],

  // Roadmap das FASES FUTURAS — esboço, sem 5W2H nem ação de 48h.
  // Só aparece em plano grande/programa. Cada fase vira um ciclo quando promovida.
  "fases_futuras": [
    {
      "nome": "Fase 2 — Retenção proativa",
      "resultado": "string — estado do mundo ao fim da fase",
      "periodo": "out–nov/2026",
      "marcos_previstos": [
        {
          "nome": "string — marco esboçado",
          "resultado_verificavel": "string (opcional)",
          "prazo": "string — data ou período estimado (opcional)"
        }
      ]
    }
  ],

  "riscos": [
    {
      "risco": "string",
      "impacto": "Alto | Médio | Baixo",
      "mitigacao": "string",
      "dono": "Nome"
    }
  ],

  "premissas": ["string — o que estamos assumindo sem prova"],

  "gatilhos_ajuste": ["Se até 15/08 o indicador não se mover, abandonamos o marco 3."],

  "backlog": [
    {"item": "string", "motivo_adiamento": "string"}
  ],

  // Só na v2+ (modo REVISÃO)
  "check_act": {
    "entregue": ["string"],
    "nao_entregue": [{"item": "string", "motivo": "string"}],
    "aprendizados": ["string"],
    "mudancas": ["string"]
  }
}
```

## `fases_futuras` vs `backlog`

Os dois guardam o que ficou fora da fase ativa, mas por razões diferentes:

- **`fases_futuras`** — sequência *planejada* do objetivo. São ciclos que virão, com resultado e período. É o roadmap.
- **`backlog`** — itens *soltos*, sem fase definida, adiados para manter o plano executável. Podem ser promovidos numa revisão, mas não têm lugar reservado.

Se um item é "vamos fazer, na Fase 2", é `fases_futuras`. Se é "talvez, quando sobrar fôlego", é `backlog`.
