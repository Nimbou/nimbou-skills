# Padrões de mídia, conteúdo e controles

Use os trechos como referência adaptável ao projeto, não como um tema obrigatório.

## Uma imagem completa com fundo contínuo

Separe duas responsabilidades:

- **Principal:** `contain`, sem corte, filtro ou blend; usa resolução suficiente para a área pintada e DPR.
- **Decorativa:** mesma foto em `cover`, blur e overlay claro, fora da árvore acessível. Pode ter resolução menor; isso precisa ser medido, pois fontes diferentes acrescentam requisições.

Mantenha altura/proporção de mídia estável por família. Um livro, um vídeo e uma arte autoral não precisam da mesma proporção. Em cards horizontais, elimine dependência circular entre `height:100%`, linha de grid automática e tamanho intrínseco da foto; compare a geometria resultante, não só a regra CSS.

Exemplo estrutural, com imagens fornecidas pelo wrapper/pipeline existente:

```html
<div class="card-media">
  <span class="card-media__backdrop" aria-hidden="true">
    <img src="foto-decorativa.webp" alt="">
  </span>
  <img class="card-media__image" src="foto-principal.webp" alt="Descrição útil da arte">
</div>
```

```css
.card-media {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  height: var(--card-media-height, 18rem);
  padding: 0;
}
.card-media__backdrop {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}
.card-media__backdrop img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: blur(var(--card-backdrop-blur, 18px));
  transform: scale(1.14);
}
.card-media__backdrop::after {
  content: '';
  position: absolute;
  inset: 0;
  background: var(--card-image-overlay, rgb(255 255 255 / 74%));
}
.card-media__image {
  position: relative;
  z-index: 1;
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
  filter: none;
  mix-blend-mode: normal;
}
```

Adapte classes para o escopo do componente, tokens, alt, dimensões intrínsecas, `srcset`, `sizes` e fallback. Os números do exemplo não definem o design de todos os projetos. Se mídia está dentro de um único link com título equivalente, evite repetir desnecessariamente o nome acessível. Uma arte com texto continua precisando de conteúdo equivalente acessível no fluxo de leitura.

No carregamento, a mídia LCP deve ser detectável e priorizada; o restante pode ser lazy. `aria-hidden` não elimina custo de rede ou LCP. Reutilize o diagnóstico de `nuxt-performance` se a mudança alterar o carregamento.

## Anatomia e ações

Considere superfície, mídia, categoria/metadados, título, resumo e ações como regiões. Nem todo card precisa de todas elas. Separe conteúdo por importância, sem empilhar rótulos redundantes.

- Grid: `minmax(0, 1fr)`, filhos com `min-width:0`; Flexbox no corpo permite empurrar ações para o fim sem truncar títulos.
- Comparar box sizing, line-height, gaps e padding evita diferenças entre a demo, estilos globais e HTML inicial. Uma regra `min-height` tem efeitos diferentes em content-box e border-box.
- Um card com uma ação pode ser um link único, com CTA visual não interativo. Se houver várias ações independentes, use contêiner sem link envolvendo links/botões separados. Não aninhe botão ou link em outro link.
- PDF/repositório mantém destino real e contexto acessível. Vídeo usa preview e reprodução voluntária; imagem de play decorativa não substitui o nome da ação.
- Mudança de rótulo visual não exige mudar rota histórica: preserve slugs e SEO quando o usuário só pediu “Publicações” em vez de “Artigos”.

## Ícones e controles pequenos

Meça o glifo efetivo, a caixa do ícone e o alvo de toque. Fontes de ícones podem herdar tamanho menor do botão; confira `font-size`, pseudo-elemento e alinhamento, não só width/height do controle.

Para um FAB de 56 px, um ícone de 32 px pode atender ao pedido de mais destaque; é um exemplo, não uma regra global. Use a prop/token de tamanho da biblioteca instalada. Se houver rótulo em mobile, some **uma vez**: largura do ícone + gap/margens + texto + padding total. Um ícone de 32, gap8, rótulo251 e padding total40 requer 331 px, portanto não cabe em 284 px.

Ajuste caixa alta, espaçamento, composição ou rótulo conforme o projeto, e confirme os limites dos elementos no navegador. Não reduza o alvo de toque para encaixar o desenho. Siga o padrão do projeto para alvos confortáveis e mantenha foco visível e nome acessível de ações sem texto.

Botões flutuantes não devem cobrir leitura, rodapé ou outras ações em telas pequenas. Preserve a estratégia responsiva do projeto; deslocar contato ao rodapé pode ser adequado, mas não é obrigatório para todo site.

## Dados, primeira renderização e navegação

Reuse dados reais e seus donos. Conteúdo HTML do CMS passa pelo tratamento seguro do projeto; resumo é texto inerte, sem alterar o campo salvo. Se os dados não vierem completos na coleção, resolva o contrato/carga no dono existente; não faça uma consulta por card como atalho.

Quando houver SSR/PHP e SPA, o mesmo dado deve produzir conteúdo, imagens e dimensões equivalentes nas duas fases. Compare com JavaScript atrasado e após a montagem. Não remova a primeira renderização nem invente um atraso de loading para disfarçar divergência.

Teste o clique da coleção para o detalhe e a volta. Se uma página fica vazia ou mostra item anterior, inspecione rota, parâmetros, id, chamada de dados e console. Em layouts que usam `RouterView` diretamente, confirme que o composable lê o contexto de rota realmente ativo; não troque todos os imports automaticamente nem migre o router por causa de um sintoma. Também confira mudança de parâmetros dentro da mesma rota quando esse fluxo existir.

Verificar `document.scrollWidth <= viewportWidth` não basta para controles: o conteúdo pode escapar do próprio botão sem causar overflow no documento. Compare os limites de ícone/rótulo com o controle e salve um screenshot.
