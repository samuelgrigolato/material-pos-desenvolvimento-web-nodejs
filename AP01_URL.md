# URL ao invés de Querystring

Na seção 1 (introdução ao Node.js), foi passada uma solução parecida com a seguinte, para identificação de caminho e query string no recebimento de uma requisição HTTP:

```js
const http = require('http');
const querystring = require('querystring');


const server = http.createServer((req, res) => {
    const url = req.url.split('?');
    const path = url[0];
    const queryParams = url.length > 1 ? querystring.parse(url[1]) : {};
    res.write(path + '\n');
    res.write(JSON.stringify(queryParams) + '\n');
    res.end();
});
server.listen(8080);
```

Existe uma forma mais limpa de fazer essa codificação, sem a necessidade de nenhum módulo externo aos nativos do Node. Isso se dá com o uso do módulo URL, especificamente o método `url.parse`, que recebe uma URL e retorna um objeto com os detalhes.

```js
const http = require('http');
const url = require('url');


const server = http.createServer((req, res) => {
    const reqUrl = url.parse(req.url, true);
    res.write(JSON.stringify(reqUrl));
    res.end();
});
server.listen(8080);
```

Além de ser mais simples, essa solução retorna muito mais informações da URL do que a solução original.
