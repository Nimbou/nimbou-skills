---
name: release-notes
description: Use para gerar as Notas de Versão em PDF do Sistema de Gestão de Projetos da FAEPEN, destinadas a stakeholders e usuários (não a devs). Gatilhos "gere as notas de versão", "notas de versão da X.Y.Z", "novidades desde a X.Y.Z", "release notes pra gerência/usuários". Traduz o CHANGELOG técnico em linguagem de negócio, agrupa em frentes temáticas e aplica selos de fase (NOVO/ALPHA/BETA), com a identidade visual FAEPEN. NÃO use para changelog técnico bruto, para outros produtos, nem para versionar o PDF no repositório.
---

# Notas de Versão FAEPEN

## Overview

Transforma o `CHANGELOG.md` de uma faixa de versões num **PDF institucional** que
stakeholders e usuários entendem: capa com a identidade FAEPEN, sumário, e uma
seção por **frente temática** com itens em linguagem de negócio e selos de fase.

**Princípio central:** o changelog e as notas de versão **não são o mesmo texto
em dois tons — são documentos para pessoas diferentes.** O changelog lista
commits para quem lê código; as notas dizem *o que mudou para quem usa o sistema*.
Encolher o changelog produz notas ruins; **traduzir e destilar** produz boas.

## Divisão de trabalho

| Camada | Dona | O quê |
|---|---|---|
| **Julgamento** | você (o agente) | ler o CHANGELOG, traduzir para negócio, agrupar em frentes, escolher os selos de fase, escrever o `notes.json` |
| **Layout** | `scripts/build_release_notes.py` | renderizar capa + sumário + seções com a identidade FAEPEN; numerar as seções; anexar os disclaimers de fase |

O script **não** lê o CHANGELOG — quem interpreta é você.

## When to Use

- Saiu (ou vai sair) uma versão e alguém não-técnico precisa saber o que mudou.
- O pedido é "notas de versão", "novidades desde a X.Y.Z", "release notes pra gerência/usuários".

**NÃO use quando:**
- Pedem o changelog técnico cru (commits, hashes) → isso é o próprio `CHANGELOG.md`.
- É outro produto/marca → esta skill é só FAEPEN.

## Fluxo

1. **Descubra a faixa de versões.** Peça a versão de origem se não veio ("desde a X.Y.Z").
   - `git tag --sort=-creatordate | head` — versões existentes.
   - `grep -n "^## \[" CHANGELOG.md` — cabeçalhos e datas de cada versão.
   - Se o checkout estiver atrás da tag, leia `git show v<tag>:CHANGELOG.md`.
   - A faixa costuma cobrir **vários patches** (ex.: desde a 1.72.0 = 1.72.1 + 1.72.2 + 1.72.3 + 1.73.0). Some tudo.
2. **Traduza e agrupe** (ver as duas regras abaixo).
3. **Escreva o `notes.json`** (schema abaixo).
4. **Renderize:** `python scripts/build_release_notes.py notes.json <saida>.pdf`
5. **Confira olhando** (layout de PDF quebra fácil): renderize as páginas para PNG e leia as imagens.
   Ex.: `python -c "import fitz; d=fitz.open('saida.pdf'); [d[i].get_pixmap(dpi=110).save(f'v{i}.png') for i in range(d.page_count)]"`.
   Cheque: capa e selos corretos, sumário com todas as seções e badges, zero jargão, nada transbordando.
6. **Entregue como arquivo local — NÃO commite** (ver "Regra do repositório").

## Regra 1 — traduza para linguagem de negócio (a substância)

Cada item diz *a consequência para o usuário*, não o mecanismo. **Corte o ruído
técnico**, que não vira item:

- hashes de commit, número de PR/issue, nomes de branch;
- "Onda 1/2/3/4", "Batch N", follow-ups de code-review, "15 achados da revisão";
- refactors/typecheck/lint/CI/migrations e ajustes de contrato OpenAPI **invisíveis ao usuário**
  (no máximo viram um item genérico "Correções gerais" na última seção);
- termos de código: nomes de tabela/coluna, status de enum, `kind`→`subtype`, `individuals.READ`
  vira "permissão de leitura de pessoas físicas", etc.

Se você não sabe o que um commit significa para quem usa o sistema, é sinal de que
provavelmente não vira item — ou precisa de leitura do código antes de afirmar.

## Regra 2 — frentes e selos de fase

**Frentes:** agrupe os commits por tema que o usuário reconhece (Tarefas, Chat,
Diárias, Bolsas, Orçamentos, Acessos…), não por tipo de commit. 6 a 9 frentes é o
tamanho usual; a primeira é o **destaque** da versão. A última costuma ser
"Navegação e Ajustes" / "Acessos e Ajustes" (guarda-chuva das correções miúdas).

**Selos de fase** (`badge`) — aplique só quando souber, e **respeite reclassificações
do usuário** (ele frequentemente mistura: "X é ALPHA, Y é BETA"):

| Selo | Significado | Quando |
|---|---|---|
| `NOVO` | Liberado para uso | recurso novo já em produção real |
| `BETA` | Uso acompanhado, sujeito a ajustes | funcional, mas ainda pode mudar |
| `ALPHA` | **Só para testes, não usar em operação real** | em validação, dados/comportamento podem mudar |
| (omitido) | melhoria/correção comum | não precisa de aviso |

O script **anexa sozinho** o disclaimer padrão de ALPHA/BETA ao final da `note` da
seção — você escreve só a frase-lead curta ("O que é"), não o aviso inteiro.

Fases já consolidadas em versões anteriores (releases recentes): **Cadastro de
Estágio = ALPHA**, **Ponte com o Zeev / Diárias-via-Zeev = BETA**. Reaproveite por
padrão e deixe o usuário reclassificar.

## notes.json (entrada do script)

`version` e `sections` são obrigatórios. O resto é opcional, mas `since`, `date`,
`intro` e `stats.tiles` deixam a capa completa. **A numeração das seções é
automática** (01, 02, …) — não a coloque no título.

```json
{
  "version": "1.73.0",
  "since": "1.72.0",
  "date": "11 de agosto de 2026",
  "intro": "1 parágrafo com o marco da versão. Aceita <b>negrito</b>.",
  "stats": {
    "tiles": [
      {"num": "8",   "label": "FRENTES DE\nMELHORIA"},
      {"num": "2",   "label": "RECURSOS\nEM TESTE"},
      {"num": "+20", "label": "FUNCIONALIDADES\nENTREGUES"},
      {"num": "+45", "label": "ENTREGAS\nTÉCNICAS"}
    ]
  },
  "sections": [
    {
      "title": "Fila Unificada de Tarefas e Chamados",
      "tagline": "Tarefas e chamados numa listagem só.",
      "badge": "NOVO",
      "note": "A fusão de tarefas e chamados foi concluída.",
      "items": [
        {"title": "Uma listagem, um lugar", "desc": "Frase de negócio, sem jargão."},
        {"title": "Busca pelo código", "desc": "..."}
      ]
    },
    {
      "title": "Navegação e Ajustes",
      "tagline": "Correções gerais.",
      "items": [
        {"title": "Correções gerais", "desc": "Diversos ajustes de estabilidade acompanham a versão."}
      ]
    }
  ]
}
```

- `badge`: `"NOVO"` | `"ALPHA"` | `"BETA"` ou **omitido**. Qualquer outro valor falha alto.
- `note`: frase-lead curta da seção. Para ALPHA/BETA o script completa com o disclaimer; para NOVO/sem-badge, a caixa só aparece se você escrever a lead.
- `label` dos tiles aceita `\n` para quebrar em duas linhas.
- `logo`: opcional; por padrão o script acha o logo institucional no repo do produto (ou use a env `FAEPEN_LOGO`). Sem logo, cai num título textual.

## Regra do repositório (não commitar o PDF)

O PDF é entregue como **arquivo local** (padrão: `docs/release-notes/` do repo do
produto, que é **gitignored**). **Nunca** rode `git add`/`git commit` do PDF, e
nunca versione-o. Se `docs/release-notes/` não existir, crie a pasta; confirme com
`git check-ignore` que ela é ignorada antes de entregar.

## Common Mistakes

- **Copiar o changelog em vez de traduzir** → item com hash, "Onda 3", nome de tabela. Diga a consequência, não o commit.
- **Uma seção por tipo de commit** (Funcionalidades/Correções) → agrupe por tema que o usuário reconhece.
- **Inflar com ruído técnico** → refactor/lint/CI/migration invisível não vira item; no máximo "Correções gerais".
- **Numerar o título à mão** ("01 Fila…") → a numeração é automática; o `1.` duplicaria.
- **Escrever o disclaimer de fase inteiro na `note`** → o script já anexa; a `note` é só a lead.
- **Ignorar reclassificação do usuário** → quando ele diz "X é ALPHA", o selo de X muda, e só o dele.
- **Gerar sem olhar o PNG** → altura/estrutura corretas não garantem bom layout (título espremido, órfã). Sempre renderize e leia.
- **Commitar o PDF** → é local e gitignored; versioná-lo é o erro que esta skill existe para não repetir.
