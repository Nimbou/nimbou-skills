# Diagnóstico orientado pela medição

Leia a seção correspondente ao gargalo observado; não execute toda a lista em qualquer site.

## Imagens e camadas decorativas

Confira o nó apontado pelo relatório: pode ser a cópia de fundo, não a foto principal. `aria-hidden` controla acessibilidade, não download nem participação no LCP.

Compare caixa CSS, área realmente pintada por `contain`, proporção, DPR, `sizes`, candidatos do `srcset`, `currentSrc`, formato e bytes transferidos. `sizes` orienta a seleção do recurso; não muda o enquadramento CSS. O navegador pode reutilizar um candidato maior já em cache, por isso uma inspeção quente não comprova o comportamento em cache frio.

Para uma arte de 970×1280 em área de 380×340 com `contain`, a largura pintada é aproximadamente `min(380, 340 × 970 / 1280) = 258 px`. Em DPR 1,75, a necessidade fica próxima de 452 pixels de origem. Entre candidatos 320/640/960, 640 é um candidato adequado; confirme a escolha real. O cálculo muda conforme arte, altura, breakpoint e DPR.

Se o visual aprovado usa a mesma foto desfocada com overlay claro:

- Preserve o foreground nítido, completo e sem padding quando esse for o pedido.
- O fundo pode usar uma derivada menor: o desfoque tolera menos detalhe. Mantenha proporção e enquadramento aprovados.
- Derivadas diferentes podem acrescentar uma requisição; compare o total transferido, não só o tamanho de um arquivo. Mesma URL pode aproveitar cache; duas tags não significam necessariamente dois downloads.
- Não troque a foto por cor/gradiente nem remova a camada só para subir a nota.
- Priorize apenas a mídia crítica visível. Conteúdo abaixo da dobra continua sob demanda. Preload, quando necessário, deve corresponder ao formato, `imagesrcset` e `imagesizes` efetivamente escolhidos; evite downloads concorrentes.
- Reserve dimensões/proporção para evitar CLS e mantenha fallback quando faltar derivada.

Use WebP/AVIF conforme suporte e pipeline existentes; preserve originais. Um formato moderno, por si só, não garante ganho.

## Primeira renderização e montagem do SPA

Em sites que servem conteúdo em PHP/SSR antes do Vue, observe as duas fases:

- HTML inicial e SPA devem usar os mesmos dados atuais, ordem, dimensões de mídia e conteúdo principal.
- Dados de bootstrap devem ser consumidos uma vez, com nova tentativa buscando a API real. Não duplique a mesma carga na página e em cada card.
- Identifique se o elemento crítico depende de JavaScript para aparecer ou se ele é removido/recriado tardiamente. Não presuma que toda espera seja rede.
- Compare visibilidade, geometria, foco e menu durante a troca; não deixe uma versão antiga cobrindo a nova.
- Dependências críticas, CSS, fontes e manifesto devem pertencer ao mesmo build. Em publicação incremental, confira recursos e metadados antes de trocar a entrada; preserve arquivos de infraestrutura e conteúdo.

Essa seção não pede adicionar SSR a todo SPA. Use a arquitetura existente e só proponha mudança maior com causa e escopo demonstrados.

## Fontes, CSS, JavaScript e servidor

| Evidência | Próxima investigação |
|---|---|
| TTFB alto | Resposta do documento/API, cache e tempo do servidor. Não atribua ao frontend sem medir. |
| Descoberta tardia | Imagem/fonte no HTML, prioridade, preload coerente e bloqueio por JS. |
| Transferência longa | Resolução, bytes, compressão, cache e origens concorrentes. |
| Recurso pronto, render atrasado | CSS bloqueante, fonte, inicialização/hidratação, tarefas longas e visibilidade. |
| CLS | Dimensões de mídia, skeleton, fontes e mudanças entre HTML inicial e Vue. |
| TBT alto | Trabalho de CPU e dependências identificados no trace; adie código sem comprometer interações. |

Não remova todo CSS “não usado”: estilos responsivos, estados de erro, HTML do CMS e nomes calculados podem não aparecer na amostra. Ao podar utilitários, use coleta coerente com o projeto e verifique os breakpoints.

Carregue fontes necessárias em formatos/subsets disponíveis. Teste acentos, pesos e fallback; não faça o texto desaparecer para melhorar o screenshot. Não instale dependências nem atualize o framework como primeira tentativa de corrigir um gargalo específico.

## Comparação e relatório

Monte uma linha por URL **e** perfil: origem/ferramenta, versão, build, conteúdo, cache/rede/CPU, amostras, Performance, FCP/LCP/TBT/CLS/SI e demais categorias. Prefira milissegundos no JSON, pontos de 0–100 para categorias e valor sem unidade para CLS. Mantenha os links de origem próximos das conclusões.

Não misture Google PSI com CLI local como se fossem o mesmo experimento. Alterações de conteúdo, perfil, versão, host ou cache devem estar explícitas; se impedem comparação, registre uma nova baseline. Erro de auditoria não equivale a nota zero.

O comparador verifica apenas campos presentes no relatório. A igualdade de conteúdo, origem das medições e a identificação da versão publicada precisam de verificação externa. Não interprete delta observado como prova isolada de causalidade.

### Referências oficiais

- [LCP e suas etapas](https://web.dev/articles/optimize-lcp).
- [Descoberta do recurso LCP](https://developer.chrome.com/docs/performance/insights/lcp-discovery).
- [Performance Insights](https://developer.chrome.com/docs/performance/insights).
