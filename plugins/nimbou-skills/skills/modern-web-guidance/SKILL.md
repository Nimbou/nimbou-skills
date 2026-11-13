---
name: modern-web-guidance
description: Use when Nuxt/Vue or other web frontend work involves HTML, CSS, browser APIs, accessibility, performance, or browser compatibility. Also applies to requested legacy-pattern modernization; excludes backend, tooling, and copy-only edits.
---

# Modern Web Guidance

Consulte os guias oficiais de plataforma web para fundamentar decisões concretas. Esta adaptação do [Modern Web Guidance](https://github.com/GoogleChrome/modern-web-guidance) integra a consulta ao fluxo Nuxt/Vuetify do Nimbou; os guias continuam mantidos na fonte oficial.

## Buscar e ler

Antes de escolher ou implementar uma técnica de HTML/CSS/DOM, identifique a capacidade relevante. Não ative a consulta por uma edição apenas textual, de backend ou de configuração de ferramentas.

Use a CLI sob demanda, sem adicionar dependências ao `package.json` da aplicação nem instalar outro plugin:

```sh
pnpm dlx modern-web-guidance@latest search "responsive container layout"
pnpm dlx modern-web-guidance@latest retrieve "responsive-design"
```

A segunda chamada exemplifica um ID; nas tarefas, escolha IDs realmente retornados pela busca. Faça consultas curtas, genéricas e com um assunto por vez; omita caminhos, dados privados, nomes de componentes e frameworks. Busque a capacidade do navegador, por exemplo `confirmation modal dialog`, não o nome da feature do produto.

Leia as descrições e recupere somente os guias pertinentes, inclusive uma disciplina geral quando necessária. Sem resultado útil, reformule uma vez; se continuar sem cobertura, consulte documentação oficial específica. Não invente IDs nem recupere guias sem relação. Leia integralmente os guias usados, inclusive eventual arquivo temporário informado pela CLI. Reutilize o conteúdo já consultado na mesma tarefa quando assunto e restrições não mudaram.

`pnpm dlx` precisa de rede na primeira obtenção e pode consultar atualizações com `@latest`. Se pnpm não estiver disponível, use `npx -y modern-web-guidance@latest` com os mesmos argumentos. Respeite as permissões efetivas do ambiente. Sem acesso à CLI, explicite a limitação e continue com documentação oficial acessível e evidência local; não bloqueie a tarefa nem alegue ter consultado guias indisponíveis.

## Aplicar em Nuxt/Vuetify

- Leia `AGENTS.md`, versões instaladas, política de navegadores, `DESIGN.md`, `GUIDELINES.md` e wrappers existentes. Preserve o escopo e os contratos da skill chamadora: desenho não implementa, auditoria não edita e otimização exige evidência do gargalo.
- Adapte exemplos vanilla ao Vue e aos componentes locais. Não substitua `VDialog`, seletores, campos ou wrappers compartilhados apenas por existir uma API nativa. Evite manipular diretamente nós gerenciados pelo Vue; mantenha ownership de estado, foco e eventos.
- Preserve SSR e hidratação: acesso ao DOM somente no cliente, recursos com ciclo de vida e limpeza apropriados, IDs estáveis entre servidor/cliente e instâncias. Não desative SSR, altere build targets nem adicione polyfills só para acomodar um exemplo.
- Verifique compatibilidade nos guias e na política local. Sem política explícita, prefira Baseline Widely available; para outros recursos, siga os fallbacks pertinentes e preserve funções essenciais nos navegadores atendidos. Não habilite Origin Trials ou recursos voláteis em `.mwgrc` sem pedido explícito.
- Use tokens e componentes do projeto. Se uma regra visual local divergir de um exemplo, adapte a técnica ao design aprovado; se houver incompatibilidade funcional ou de acessibilidade, explicite o conflito antes de escolher uma alternativa.

## Modernização ampla

Somente para pedido de varredura ou modernização ampla, execute no diretório solicitado:

```sh
pnpm dlx modern-web-guidance@latest legacy-scan apps/portal --json
```

O scan cobre apenas parte do catálogo e não substitui auditoria completa. Confira cada achado no código e na rubrica `keepWhen`/`dropWhen`; descarte falsos positivos, bibliotecas de terceiros e fallbacks ainda necessários. Recupere o guia correspondente antes de propor uma mudança. Pedido de análise entrega achados. Com correções autorizadas, implemente no recorte e verifique novamente; se a chamadora for uma auditoria somente leitura, entregue os achados ao passo de implementação sem editar durante a auditoria. Não rode o scan para corrigir um componente específico nem para forçar zero achados.

## Verificação e entrega

Compare a decisão ou implementação com os guias efetivamente lidos. Valide comportamento, acessibilidade, viewports e SSR conforme o recorte e a skill chamadora; orientações não substituem medições de performance nem verificações de navegador. Relate os IDs aplicados e sua consequência concreta, além de limitações relevantes. Não crie um relatório adicional obrigatório para consultas sem impacto na entrega.
