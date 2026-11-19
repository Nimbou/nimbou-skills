# Verificação da migração

Use estes comandos durante o inventário, após mudar a delegação e após mover o site. Troque os valores de exemplo pelo domínio e servidores confirmados. As consultas abaixo são somente leitura.

## DNS

```sh
domain=empresa.com.br
parent_ns=servidor-autoritativo-da-zona-pai.example
old_ns=ns1.antigo.example
new_ns=ns1.novo.example
new_ns_secondary=ns2.novo.example

# Delegação no pai e estado de DNSSEC.
dig @"$parent_ns" "$domain" NS +norecurse +noall +comments +authority +answer
dig @"$parent_ns" "$domain" DS +norecurse +noall +comments +authority +answer

# Resposta autoritativa, TTL e serial. Procure o sinalizador aa.
for server in "$old_ns" "$new_ns" "$new_ns_secondary"; do
  for type in SOA NS A AAAA MX TXT CAA; do
    dig @"$server" "$domain" "$type" +norecurse +noall +comments +answer
  done
  dig @"$server" "www.$domain" A +norecurse +noall +comments +answer
  for type in A AAAA CNAME; do
    dig @"$server" "mail.$domain" "$type" +norecurse +noall +comments +answer
  done
done

# Faça a mesma análise para cada destino real de MX e hostname do inventário.
for resolver in 1.1.1.1 8.8.8.8 9.9.9.9; do
  for type in NS A AAAA MX; do
    dig @"$resolver" "$domain" "$type" +noall +comments +answer
  done
  dig @"$resolver" "mail.$domain" A +noall +comments +answer
done
```

Repita para os autoritativos antigos e novos relevantes. Compare resultados por nome e tipo. Examine `NXDOMAIN`, `SERVFAIL`, respostas vazias, serial divergente e valores antigos junto a novos. Use também o resolvedor local, omitindo `@servidor`. Um NS na seção de autoridade do pai representa a delegação. Os TTLs restantes de resolvedores podem diferir do TTL publicado pelo servidor autoritativo.

Para DNS-01, consulte TXT em `_acme-challenge.$domain` e, se solicitado pela autoridade certificadora, em `_acme-challenge.www.$domain`. Confirme os registros exigidos nos autoritativos delegados e em resolvedores públicos antes de acionar a validação.

## Destino web antes da virada

```sh
new_ip=203.0.113.42

curl -fsS -D - -o /dev/null --resolve "$domain:443:$new_ip" "https://$domain/"
curl -fsSL -D - -o /dev/null \
  --resolve "www.$domain:443:$new_ip" --resolve "$domain:443:$new_ip" \
  "https://www.$domain/"
```

Repita para caminhos críticos e valide o conteúdo esperado, o destino final e os arquivos carregados. Inclua o endereço IPv6 se a zona tiver `AAAA`. Use o certificado confiável com o hostname público. Após mudar o DNS, repita sem `--resolve` e confira o IP remoto, o status HTTP e a URL final.

## Correio

Confirme DNS e certificados dos hosts anunciados pelo provedor atual. Se o serviço oferecer IMAP sobre TLS na porta 993, por exemplo, use `openssl s_client -connect "$mail_host:993" -servername "$mail_host" -verify_hostname "$mail_host" -verify_return_error </dev/null`. Um teste de TLS confirma o endpoint, enquanto envio e recebimento precisam de uma caixa de teste autorizada. Informe a cobertura realizada.
