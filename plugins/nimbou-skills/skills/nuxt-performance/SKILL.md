---
name: nuxt-performance
description: Use when a Nuxt/Vue site has slow mobile loading, high LCP, layout shifts, or a Lighthouse/PageSpeed target, or needs a before-and-after performance report. Applies to existing SSR, SPA and CMS-backed sites; not a visual redesign or a deployment authorization.
---

# Nuxt Performance

Melhore a experiência medida, preservando conteúdo, design aprovado e funções. Uma nota alta em outra URL, perfil ou versão não comprova a meta atual.

## Fechar o recorte

Leia as instruções do projeto, versões instaladas, scripts de build e política de publicação. Liste URLs, perfis, meta solicitada e elementos que devem permanecer. Separe auditoria de correção conforme o pedido; não transforme otimização em migração de framework ou troca do CMS.

Use build de produção com conteúdo representativo. Dados publicados são a fonte de verdade; fixture vazio não representa catálogo preenchido. Não sobrescreva banco ou uploads para reproduzir uma demo.

## Medir e investigar

1. Registre baseline com URL, data, commit/build, conteúdo, origem da ferramenta, versão do Lighthouse, dispositivo, rede/CPU e cache. Para páginas públicas, use Google PageSpeed Insights se solicitado; para páginas privadas/locais, use ferramenta local sem enviar credenciais ou URLs sensíveis ao Google.
2. Guarde relatório/link e Performance, FCP, LCP, TBT, CLS, Speed Index, acessibilidade, boas práticas e SEO. Campo ausente é indisponível, não zero.
3. Identifique o elemento LCP, `currentSrc`, bytes e cadeia de rede. Separe TTFB, descoberta, transferência e renderização antes de editar. Consulte [diagnóstico](reference/diagnostics.md) para imagens, fontes, bundle ou primeira renderização seguida de SPA.
4. Altere o gargalo observado em incrementos verificáveis. `eager`/`fetchpriority` não substituem dimensionamento; imagem menor não resolve espera por JavaScript ou CSS.

## Corrigir e comparar

Preserve imagens com texto completas, contatos, rastreamento consentido e ações reais. Use as abstrações de mídia/dados existentes; não remova conteúdo para alcançar a nota. Valide aparência e interações afetadas no navegador, em desktop e mobile.

Depois de uma correção, gere o build e repita nas mesmas URLs/perfis, com o mesmo conteúdo e condições equivalentes. Se houve publicação autorizada, meça a versão realmente publicada. Reinicie a baseline quando mudar o cenário.

Perto da meta ou diante de oscilação, faça uma pequena série, normalmente três execuções por condição; apresente mediana e faixa, sem escolher só a melhor. Uma amostra é provisória. Não imponha repetições sem mudança, falha ou dúvida concreta.

Se houver JSON oficial exportado, o comparador auxilia a leitura:

```sh
node <skill-dir>/scripts/compare-lighthouse.mjs antes.json depois.json
```

Aceita Lighthouse JSON ou envelope PageSpeed `lighthouseResult`. Código 2 indica configuração incompatível/desconhecida; 1 indica entrada inválida. Zero indica apenas configuração compatível, não meta atingida. O script não comprova igualdade de conteúdo, build ou origem das medições.

## Entrega e limite

Relate mudanças, valores antes/depois, condições, links e problemas restantes. Diferencie laboratório de dados de campo; TBT não comprova INP. Não prometa nota ou Core Web Vitals sem evidência.

Continue pelas causas fundamentadas dentro do escopo autorizado. Se uma mudança não melhora o gargalo, investigue a próxima hipótese; evite refazer builds e publicações só para perseguir variação. Sem próximo passo viável no escopo, entregue resultado parcial e a meta pendente. Publicar segue a autorização da sessão e o procedimento do projeto, sem nova confirmação redundante nem permissão implícita criada por esta skill.
