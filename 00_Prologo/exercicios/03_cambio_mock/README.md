# Proposta de exercício: Câmbio mock

Implemente um endpoint que faça o mesmo papel do endpoint do exercício anterior. Use dados fictícios e um conjunto pequeno de moedas.

## Dicas

* Se quiser testar a integração com a página do exercício anterior, lembre-se de mudar a porta de escuta deste aqui para não conflitar com o `http-server`;
* Ao invés de efetuar a chamada diretamente da página HTML para este backend, use a funcionalidade de `proxy` do `http-server`: `--proxy http://localhost:8081` (8081 é a porta que usou para este servidor mock). Se você tentar chamar diretamente, irá enfrentar problemas de segurança (CORS, abordaremos isso em aulas futuras).
