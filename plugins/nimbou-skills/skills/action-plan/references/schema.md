# Schema do `plano.json`

Campos ausentes são omitidos do PDF (nada quebra), mas `titulo`, `objetivo`, `ciclo` e `marcos` são o mínimo útil. `escopo` e `fases_futuras` só entram em plano grande/programa.

```jsonc
{
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
      "nome": "string — estado do mundo, não esforço",
      "resultado_verificavel": "string — como se sabe que aconteceu",
      "indicador": "string (opcional)",
      "prazo": "15/08/2026",
      "acao_48h": "string — menor ação física que quebra a inércia",
      "acoes": [
        {
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
