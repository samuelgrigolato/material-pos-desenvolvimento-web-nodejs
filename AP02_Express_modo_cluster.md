# Express modo cluster

Na seção sobre introdução ao Node.js foi introduzido o conceito de clusterização, e as vantagens que essa técnica oferece no aproveitamento de recursos de seu servidor.

O framework Express não atua nativamente neste ponto, o que pode ser facilmente observado analisando os processos lançados quando se executa uma aplicação (apenas 1).

Para resolver esse problema, é possível implementar uma solução manual baseada diretamente no módulo de clusterização [1] ou usar uma solução desenvolvida pela comunidade, como o pacote `express-cluster` [2]. Veja como fica o código de uma aplicação Express usando `express-cluster` para subir vários processos simultaneamente:

```js
const express = require('express');
const cluster = require('express-cluster');


cluster(worker => {

    console.log(`Iniciando worker ${worker.id}`);

    const app = express();
    app.get('/', (req, res) => {
        let soma = 0;
        for (let i = 1; i < 1000000000; i++) {
            soma += i;
        }
        res.send(`Resposta ${soma} gerada pelo worker ${worker.id}.`);
    });

    app.listen(3000);

}, { count: 3 });
```

Uma outra solução bastante apropriada para ambientes produtivos é o uso de um gerenciador de processos, como o *StrongLoop* [3]. Crie uma nova aplicação express básica, dessa vez sem o uso de clusterização:

```js
const express = require('express');
const app = express();
app.get('/', (req, res) => {
    let soma = 0;
    for (let i = 1; i < 1000000000; i++) {
        soma += i;
    }
    res.send(`Resposta ${soma}.`);
});
app.listen(3000);
```

Instale o CLI do strongloop de modo global:

```
npm i -g strongloop
```

E execute usando a ferramenta `slc`:

```
slc start
```

Várias funcionalidades interessantes podem ser encontradas no gestor visual dessa ferramenta (execute o comando abaixo em outro terminal):

```
slc arc
```

[1] https://rowanmanning.com/posts/node-cluster-and-express/

[2] https://github.com/Flipboard/express-cluster

[3] http://strong-pm.io/
