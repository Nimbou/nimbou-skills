---
name: migrate-dns
description: Planeje ou execute a migração de DNS de um site, especialmente a troca de servidores DNS no Registro.br para uma zona cPanel ou WHM. Use para fazer a virada do site mantendo o e-mail no provedor atual, considerar TTL e DNSSEC e validar os serviços antes e depois da troca.
---

# Migração de DNS

Mude a delegação ou o endereço do site preservando os serviços que o usuário quer manter. Use a [referência de verificação](references/verificacao.md) para consultar a delegação, os servidores autoritativos, os resolvedores públicos e a hospedagem.

## Levante o estado atual

- Confirme o domínio, a hospedagem de destino, o IP do novo site, o host canônico e onde devem ficar o e-mail e os demais serviços. Descubra os nameservers pela delegação pública e confirme os de destino no painel do provedor.
- Exporte a zona ativa e guarde os valores e TTLs anteriores para reversão. Se o acesso à zona ativa estiver indisponível, consulte os autoritativos antigos e inventarie os serviços conhecidos. Inclua apex e `www`, subdomínios, `MX`, destinos do correio, `SPF`, seletores `DKIM`, `DMARC`, `SRV`, `CAA`, TXT de verificação, curingas e delegações de subdomínios quando aplicáveis. Consultas públicas por nome e tipo deixam lacunas. Informe essas lacunas e obtenha a decisão do usuário antes de delegar uma zona reconstruída.
- Consulte o registro `DS` no pai. Se houver DNSSEC, feche a transição de chaves e DS com o provedor ou registrador e verifique o efeito em resolvedores validadores. Um DS da zona antiga incompatível com a nova pode causar `SERVFAIL`. [DNS e DNSSEC no Registro.br](https://registro.br/tecnologia/dnssec/dns-e-dnssec/)
- Meça o TTL dos registros que mudarão e dos NS no pai e na zona antiga. Quando puder editar a zona antiga, reduza os TTLs relevantes com antecedência e deixe os valores antigos expirarem. Um TTL baixo na nova zona só vale para respostas obtidas dela.

## Escolha a virada

| Situação | Ação |
| --- | --- |
| Os nameservers atuais podem continuar | Atualize os registros web no DNS autoritativo atual depois de validar o destino. |
| A delegação precisa mudar e o novo site já está validado com TLS para todos os hosts públicos | Considere uma virada conjunta se a zona de destino estiver completa e os serviços preservados já estiverem desacoplados dos registros web, inclusive durante a expiração dos caches. |
| A delegação precisa mudar e o certificado ou o site depende do controle da zona nova | Faça em duas etapas. Delegue a zona mantendo o site no IP antigo. Emita o certificado e valide a nova hospedagem. Depois altere os registros web na zona nova. |

As duas etapas exigem uma única troca de nameservers no Registro.br. A segunda mudança ocorre no editor da zona nova. Use um TTL curto para os registros web que ainda mudarão, por exemplo 300 segundos se o provedor aceitar. Escolha o intervalo entre etapas pelos TTLs antigos e pelo risco de misturar respostas de ambas as zonas.

## Prepare a zona de destino

1. Reproduza os registros necessários e guarde uma cópia da zona preparada. Confira os registros em cada nameserver novo diretamente, incluindo autoridade e SOA consistente. Na virada em duas etapas, mantenha os registros web apontando para a hospedagem antiga durante a primeira etapa.
2. Se o e-mail continuar no provedor atual, mantenha os destinos de envio, recebimento, webmail e configuração de clientes que estiverem em uso. Se o MX apontar para o apex ou se `mail` for um CNAME para ele, use um hostname de correio estável com A/AAAA para a hospedagem atual e aponte o MX para esse hostname. Confirme a adequação do certificado de correio e configure o cPanel de destino para roteamento remoto se ele hospedar o site desse domínio. Confira SPF, DKIM e DMARC e preserve os remetentes autorizados ao ajustar mecanismos como `a` e `mx`. [RFC 2181, destino de MX](https://www.rfc-editor.org/rfc/rfc2181.html#section-10.3)
3. Considere o estado misto de cache antes de mover o apex. Um resolvedor pode usar o MX antigo ou um CNAME antigo de `mail` junto com o A novo e encaminhar correio ao servidor errado. Quando puder, desacople essas referências na zona ativa e aguarde seus TTLs anteriores. Sem acesso à zona antiga, mantenha o IP web antigo durante a propagação, verifique a expiração conforme os TTLs observados e trate qualquer janela encurtada com o usuário. Respostas corretas em alguns resolvedores comprovam apenas aqueles pontos de observação.

## Execute e verifique

1. Antes de salvar no registrador, confira domínio, NS atuais, NS novos e a autorização para essa mudança. No Registro.br, use **Alterar servidores DNS**. Se a sessão expirar, confirme no painel e no DNS público se a operação foi aplicada antes de repetir. [Orientações do Registro.br](https://registro.br/ajuda/gerenciamento-de-conta/)
2. Verifique a nova delegação nos servidores da zona pai e depois em resolvedores independentes. Confira o site e o e-mail em uso. Em duas etapas, encerre este ponto com o site ainda no IP antigo e o correio no provedor escolhido.
3. Emita um certificado confiável para o apex e `www` quando ambos atenderem visitantes. Se o IP web ainda apontar para a hospedagem antiga, use DNS-01 na zona que já estiver delegada, confira os TXT públicos e preserve desafios alheios. Teste diretamente o IP novo com o hostname real e TLS válido por meio de `curl --resolve`. Valide a página inicial, os redirecionamentos, as rotas, os ativos e as APIs relevantes. Confirme como o certificado será renovado. [Desafio DNS-01 do Let's Encrypt](https://letsencrypt.org/docs/challenge-types/#dns-01-challenge)
4. Com o destino aprovado nos testes, altere apenas os registros web previstos, incluindo o `AAAA` se houver IPv6. Se o WHM rejeitar uma edição por serial divergente, recarregue a zona, reconfirme o registro e reaplique somente essa alteração. [DNS Zone Manager do WHM](https://docs.cpanel.net/whm/dns-functions/dns-zone-manager/)
5. Confira os valores em todos os autoritativos e consulte resolvedores públicos e a rede do usuário. Verifique HTTPS, host canônico, rotas críticas, MX e o destino do correio. Se surgir uma regressão na segunda etapa, restaure os registros web anotados na zona ativa e valide novamente. Restaurar uma delegação também depende de caches, portanto mantenha os destinos e registros anteriores disponíveis durante a transição.

Relate o que foi de fato alterado, os TTLs observados, quais consultas ou testes passaram e o que ainda está em propagação ou pendente. Se houver um bloqueio, identifique o acesso, registro ou decisão que falta.
