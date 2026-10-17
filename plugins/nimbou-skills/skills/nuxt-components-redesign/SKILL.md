---
name: nuxt-components-redesign
description: Use when existing Nuxt/Vue components or card families need a visual/UX redesign, a branded Material Design demo, or application of an approved prototype across real pages. Not a whole-page redesign, an isolated Vitest hardening task, or a performance-only audit.
---

# Nuxt Components Redesign

Transforme uma direção visual em componentes reais, reutilizáveis e coerentes com a marca. Código e screenshot isolado não comprovam navegação nem responsividade.

## Recorte e referência

Leia as instruções locais, `DESIGN.md`, `GUIDELINES.md`, componentes existentes e versões instaladas. Sem guias, extraia referências da interface, fontes e assets e explicite suposições; não bloqueie automaticamente. Não migre Nuxt/Vuetify para redesenhar cards.

Liste famílias, consumidores, conteúdo, estados e áreas excluídas. Um wrapper/CSS compartilhado também pode alterar páginas fora do recorte: preserve consumidores excluídos com variantes ou escopo apropriado.

Defina propósito, hierarquia da informação e ação principal em poucas frases. Material Design 3, quando pedido, orienta anatomia, estados e superfícies; a identidade da marca orienta cores, fontes e ritmo.

## Demo e aplicação

Se o pedido for somente demo, mantenha-a local e isolada, com conteúdo público/sanitizado representativo, sem escrever no CMS ou substituir telas reais. Ofereça estados necessários para revisar a proposta; não invente persistência.

Quando o usuário pedir aplicação da proposta aprovada, reutilize a aprovação existente e implemente no site. Aprovação visual não transforma favoritos, diálogos ou filtros fictícios da demo em requisitos do produto. Preserve ações reais; leve controles demonstrativos apenas quando seu comportamento também fizer parte do escopo.

Reutilize catálogo e primitives disponíveis. Extraia mídia, superfície ou corpo compartilhados quando houver consumidores reais. Componentes recebem props/slots; páginas/composables existentes continuam donos dos dados. Evite componente universal com muitas flags, fetch por card e store para estado puramente local.

## Informação e imagens

Agrupe categoria, título, resumo, metadados confirmados e ação conforme o conteúdo. Títulos permanecem completos; resumos convidam ao detalhe, que conserva o texto integral. Não invente datas, locais, categorias ou tempos de leitura.

Preserve proporção de capas e artes. Quando aprovado, use imagem principal completa, sem padding, sobre cópia desfocada com overlay claro; não aplique blur, multiply ou transparência à arte principal. Use o wrapper de imagens otimizado do projeto. Leia [padrões de mídia e controles](reference/patterns.md) ao implementar essas situações; para gargalos medidos, consulte `nuxt-performance`.

Skeleton, vazio, erro e nova tentativa devem refletir estados reais. Reserve geometria sem fixar altura de títulos ou esconder conteúdo já disponível.

## Verificação e entrega

Use navegador real, preferindo o integrado quando disponível. Em famílias de componentes, confira 320, 390, 768, 1024 e 1440 px, ou a matriz do projeto; para ajuste pontual, cubra a menor largura relevante e seus breakpoints.

Confira conteúdo longo, proporções diferentes, alinhamento das ações, contraste, teclado/foco e overflow. Inspecione o tamanho do **símbolo**, além da área clicável. Garanta que ícone e rótulo caibam juntos.

Clique nos cards e ações; teste detalhe, voltar, menu, filtros e PDF/vídeo afetados. Acesso direto não prova navegação SPA. Quando houver HTML inicial seguido de Vue, compare conteúdo, dimensões e foco nas duas fases.

Faça build e verificações proporcionais; não imponha harness, E2E persistente ou typecheck a uma edição visual direta. Publique somente quando isso estiver no escopo autorizado, seguindo o procedimento do projeto; valide o build no site real.

Entregue telas/URL, mudanças, larguras e interações efetivamente conferidas, screenshot salvo e limitações. Não declare “publicado” ou “validado no mobile” com base apenas na demo desktop.
