# Proposta de exercício: Promises e Async/Await

Você possui um arquivo chamado `medicoes.jsonl`, nesse formato:

```json
{ "ts": "2023-06-02T10:30:00Z", "tipo": "temperatura", "valor": 30.25 }
{ "ts": "2023-07-03T10:30:00Z", "tipo": "temperatura", "valor": 30.25 }
{ "ts": "2023-08-04T10:30:00Z", "tipo": "temperatura", "valor": 20.25 }
{ "ts": "2023-08-04T10:30:00Z", "tipo": "vento", "valor": 120 }
```

Implemente um módulo chamado `medicoes`, que expõe um método chamado `carregarMedicoesDoTipo(tipo)`, que retorne uma `Promise` cujo resultado positivo é uma lista de objetos com a data e valor das medições solicitadas.

Exemplo de retorno da promise para a chamada `carregarMedicoesDoTipo('temperatura')`, nos dados acima:

```json
[
  { "ts": "2023-06-02T10:30:00Z", "tipo": "temperatura", "valor": 30.25 },
  { "ts": "2023-07-03T10:30:00Z", "tipo": "temperatura", "valor": 30.25 },
  { "ts": "2023-08-04T10:30:00Z", "tipo": "temperatura", "valor": 20.25 }
]
```

Faça primeiro com o modo de callbacks da biblioteca `fs`. Depois, altere para o modo de promises usando `fs.promises`. Por fim, adapte o código para utilizar `async/await`.

Use o arquivo `app.js` da pasta base para testar a solução (lembre-se do `package.json` habilitando o modo de pacotes ES6):

## Dicas

- Use a função `readFile` do pacote `fs` para ler o conteúdo do arquivo;
- Use a função `JSON.parse`, disponível globalmente, para converter as linhas do arquivo em objetos JavaScript;
- Use a função `filter`, disponível em arrays, para filtrar apenas as medições do tipo desejado.
