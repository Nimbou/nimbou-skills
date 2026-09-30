# Execução compartilhada de planos de ação e roadmaps

Data: 30/09/2026. Checkout: `C:\www\nimbou-skills`, branch `main`, base `fb2c192`.
Mudanças locais; nenhum commit, publicação do plugin ou criação de trabalho externo.

## Escopo implementado

- `action-plan`: novo modo EXECUÇÃO / ACOMPANHAMENTO, preservando entrevista,
  geração do PDF, 5W2H, fases e revisão PDCA.
- `roadmap-orchestration`: o mesmo núcleo de coordenação, com adaptador para estados
  técnicos, contratos/ondas existentes e integração com `executing-plans`.
- Núcleo normativo em `roadmap-orchestration/references/execution-core.md` e contrato
  de dados em `execution-record.md`: chats persistentes por marco, pai como escritor
  único, resultados separados, autorização continuada e heartbeat de 30 minutos.
- Tarefas humanas FAEPEN no setor exato, pós-validação da criação e conferência da
  evidência antes de liberar dependentes. Marcos mistos acompanham ações separadas.
- Reconciliação de resultados desconhecidos antes de repetir efeitos externos,
  recuperação de filhas sem mensagem e conclusão por evidência global.
- IDs opcionais no plano de gestão, compatibilidade do gerador e `plan-summary`.

## RED: baseline

Antes da mudança, um avaliador Sol/medium read-only simulou quatro cenários seguindo
as skills existentes. Detectou: plano administrativo encerrava no PDF; retomadas
exigiam nova autorização; inexistiam protocolo FAEPEN, heartbeat de 30 minutos e
callback persistente; estados terminais `integrated`/`deferred` não provavam o objetivo
administrativo. As respostas da avaliação ficaram registradas no chat principal.

O teste novo falhou antes da implementação: os dois entrypoints não carregavam
contrato comum, os arquivos de execução não existiam e o schema não separava IDs
operacionais do conteúdo de gestão. Esses itens passaram após implementar o contrato.

## GREEN e revisão

Comando focado:

```text
node --test tests/plugin/plugin-manifest.test.mjs tests/plugin/skill-tree.test.mjs tests/plugin/roadmap-orchestration.test.mjs tests/plugin/plan-execution.test.mjs
```

Resultado: **35 testes passaram**, incluindo 8 novos testes de contrato, links,
permissões, mensagens, heartbeat, evidência humana e exemplo JSON/grafo.
`git diff --check` passou.

Uma revisão comportamental com Sol/medium repetiu os quatro cenários:

1. Plano misto: despacho dos dois predecessores e bloqueio do marco final até
   evidência conferida pelo pai; sem exigir ondas de código.
2. Filha terminou sem mensagem/criação anterior incerta: recuperar o resultado,
   reconciliar sem duplicar e bloquear quando falta capacidade de consulta.
3. Humano/filha alegam conclusão sem artefato, sob prazo vencido: conservar
   verificação/bloqueio e pedir evidência/correção, sem reduzir o critério.
4. Objetivo ainda pendente, marco adiado: revisar escopo e registrar encerramento
   incompleto como `stopped`, nunca sucesso por soma de estados.

Foram corrigidos dois achados da revisão: o brief não basta como autorização para
a filha mensagear o pai; ela precisa conferir evidência humana confiável. A intenção
do callback fica no `result.md` da filha e só o pai incorpora em `operations`,
preservando o escritor único. `send_message_to_thread` é follow-up que pode disparar
turno; o pai reconcilia sua chave antes de despachar. A última revisão não encontrou
contradições bloqueantes nesses cenários.

## Bootstrap e compatibilidade

O script real `scripts/setup-codex-skills.ps1` instalou as skills em junctions
temporários sob este diretório. O link de `action-plan` ao núcleo em
`roadmap-orchestration` resolveu corretamente. As junctions foram removidas sem
alterar a instalação do usuário.

`validate-pdf.py` executou o gerador existente com o Python empacotado do Codex,
ReportLab e pypdf. Os fixtures `legacy.json` e `identified.json` geraram PDFs de uma
página com **texto e paginação idênticos**. Os IDs opcionais não mudaram a saída.

## Suíte geral e limites

A suíte geral mantém **7 falhas preexistentes neste Windows**: 6 no catálogo e 1
no wrapper Chrome DevTools. Foi extraído um snapshot de `HEAD` dos mesmos testes
e seus arquivos de suporte, executado sem as alterações e reproduziu as 7 falhas.
A cópia temporária foi removida. Os testes/scripts correspondentes não foram editados.
Diagnóstico: `spawnSync npm ENOENT`, execução de wrapper Unix e caminho Windows
passado ao Bash. Isso não implica que o bootstrap PowerShell tenha falhado.

A avaliação comportamental é uma simulação read-only, não um piloto com integrações
reais. Não foram criados chats de marcos, heartbeats nem tarefas FAEPEN. Criação com
timeout sem ID pode exigir reconciliação humana se não existir busca suficiente;
`get_task` não retorna anexos/comentários. O contrato expõe essas limitações e impede
recriação por suposição. O acompanhamento depende do executor local disponível.

Artefatos preexistentes em `docs/aniversarios/` foram preservados. O próximo teste
operacional é um plano misto autorizado com dois predecessores e um marco final.
