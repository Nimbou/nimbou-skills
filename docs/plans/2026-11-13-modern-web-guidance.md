# Modern Web Guidance no nimbou-skills

## Escopo aprovado

Adicionar `nimbou-skills:modern-web-guidance` como orientação compartilhada de plataforma web e integrá-la a `nuxt-think`, `nuxt-design-posture`, `nuxt-performance`, `nuxt-audit` e `nuxt-components-redesign`. O usuário autorizou atualização, commit, push e instalação local.

## Desenho

A skill consulta a CLI oficial com `pnpm dlx modern-web-guidance@latest search` e `retrieve`, sem copiar o catálogo nem adicionar dependências às aplicações. Os guias informam decisões sobre HTML, CSS, DOM, acessibilidade, desempenho e compatibilidade. Convenções locais, wrappers Vuetify e limites SSR/hidratação continuam sendo considerados antes da aplicação de exemplos vanilla.

As cinco skills chamadoras mantêm seus recortes: desenho não implementa, auditoria não corrige código e performance exige medições. Consultas equivalentes podem reutilizar guias já lidos na tarefa. Mudanças apenas de cópia, backend e tooling não ativam a consulta. `legacy-scan` fica restrito à modernização ampla solicitada e seus achados exigem confirmação.

O instalador existente distribui automaticamente todas as pastas de skills. Não é necessário instalar um segundo plugin ou alterar o bootstrap. A versão do plugin será incrementada para invalidar o cache da distribuição anterior.

## Execução e validação (registro anterior ao commit)

- [x] Confirmar estado Git e regras do repositório.
- [x] Criar testes de integração de instalação idempotente e referências das cinco skills; observar falha pela ausência da skill e das referências.
- [x] Validar cenários de decisão antes/depois da nova skill.
- [x] Escrever a skill compartilhada, cinco integrações e documentação de uso.
- [x] Executar testes, validar frontmatter e testar `search`/`retrieve` reais.
- [ ] Revisar e apresentar o diff efetivo, criar commit e fazer push para `origin/main`.
- [ ] Executar `./install.sh` e confirmar versão e links instalados.

## Evidência inicial

O teste de instalação falhou porque `modern-web-guidance` não existe na árvore distribuída. O teste de integração falhou porque `nuxt-think` ainda não referencia a skill compartilhada. A CLI oficial foi consultada a partir de `/tmp`, sem alteração de dependências do repositório: a busca `responsive container layout` retornou guias e `retrieve responsive-design` retornou o conteúdo esperado.

A suíte inicial, anterior às alterações das skills, teve 57 testes aprovados e uma falha preexistente: `tests/plugin/skill-tree.test.mjs:321` espera a expressão `route the change did NOT touch`, que não corresponde ao conteúdo atual de `browser-smoke` (com quebra de linha e minúsculas). Essa falha está fora desta integração.

## Evidência da integração

Os oito testes de instalação, referências e manifesto passaram. O teste do instalador executa o script real duas vezes em diretório temporário, confirma o link da nova skill e verifica que `package.json`/lockfile não são alterados. O validador de frontmatter aprovou a nova skill. A suíte completa após a integração teve 59 testes aprovados e a mesma falha anterior de `browser-smoke`.

A simulação comportamental independente, sob o teto de modelo do repositório, confirmou a lacuna antes da mudança e o encaminhamento depois dela para: revisão de card em Nuxt SSR, investigação de LCP sem correção antecipada, modernização ampla, exclusão de edição textual e auditoria sem rede. Não houve execução de UI ou medição de performance nessa simulação. O refinamento final explicita continuidade com evidência local quando a CLI está inacessível e preserva o modo somente leitura da auditoria mesmo quando correções estão autorizadas para um passo posterior.
