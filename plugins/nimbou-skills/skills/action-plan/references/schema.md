# Schema do `plano.json`

## Formato de tarefas

Use este formato quando o plano será desdobrado em tarefas no sistema ou precisa
ser lido por setores não técnicos. O gerador o detecta quando algum marco tem
`tarefas[]`; os campos legados `acoes[]`/5W2H continuam funcionando para
planos anteriores. IDs são estáveis para permitir mapeamento futuro, mas gerar
o PDF **não** cria tarefas externas.

```jsonc
{
  "id": "piloto-rh",
  "titulo": "Piloto do Portal RH",
  "versao": 1,
  "data": "20/10/2026",
  "objetivo": {"frase": "Testar em paralelo e avaliar até 31/01/2027.", "prazo": "31/01/2027"},
  "ciclo": {"proxima_revisao": "27/10/2026"},
  "fase_atual_nome": "Preparar o sistema", // opcional; padrão visual: "Fase atual"
  "marcos": [{
    "id": "ambiente-pronto",
    "nome": "Ambiente pronto para o teste",
    "resultado_verificavel": "Fluxos essenciais funcionam sem alterar produção.",
    "prazo": "30/10/2026",
    "tarefas": [{
      "id": "verificar-ambiente",
      "titulo": "Verifique o ambiente de teste.",
      "responsavel": "DONO A DEFINIR (TI)",
      "prazo": "27/10/2026",
      "depende_de": [],              // IDs de tarefas anteriores; omita se não houver
      "concluida_quando": "Ambiente e acessos conferidos.",
      "subtarefas": ["Confira os dados de teste.", "Teste o acesso do RH."]
    }]
  }],
  "fases_futuras": [{
    "nome": "Uso paralelo",
    "periodo": "Depois da preparação",
    "marcos_previstos": [{
      "nome": "Grupo testa os dois sistemas",
      "prazo": "31/01/2027",
      "depende_de": ["verificar-ambiente"] // opcional: IDs de tarefas da fase ativa
    }]
  }],
  "limites": ["O sistema atual continua oficial.", "O piloto não alimenta a folha."],
  "gatilhos_ajuste": ["Se o ambiente falhar, adiar a entrada do grupo."]
}
```

Cada ID em `depende_de` deve existir em uma tarefa do mesmo plano e apontar
para trabalho que precisa terminar antes; não crie ciclos. A ordem visual não
substitui essa relação. Subtarefas não têm responsável separado: se precisarem
de outro setor ou conclusão independente, promova-as a tarefas.
Em `fases_futuras[].marcos_previstos[]`, `depende_de` pode apontar para uma
tarefa da fase ativa para mostrar o pré-requisito sem detalhar antecipadamente
as tarefas da fase futura.

No PDF de tarefas, não aparecem `escopo`, 5W2H, primeira ação, PDCA,
`riscos` ou `backlog`. `fases_futuras` vira sequência visual e `limites`
vira conjunto de cartões; o prazo final fica no objetivo. O JSON pode manter
notas internas, mas não as apresente como obrigação do leitor.
Cada tarefa aparece em um cartão de duas colunas alinhadas pelo topo. À esquerda
ficam título imperativo, critério de conclusão curto e subtarefas necessárias;
à direita, responsável, previsão e dependências em chips arredondados.
O texto da tarefa não começa abaixo dos metadados. Não há legenda genérica antes
do primeiro marco. A identidade Nimbou e a paginação são responsabilidade do
gerador, não exigem novos campos no JSON e não fixam o número de marcos ou páginas.

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
