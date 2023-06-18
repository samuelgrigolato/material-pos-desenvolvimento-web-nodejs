const http = require('http');
const url = require('url');

const server = http.createServer(function (req, res) {
  const params = url.parse(req.url, true).query; // sem o true, o atributo query é uma simples string
  const nome = params.nome;
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.write(`Olá, ${nome}!`);
  res.end();
});

server.listen(8080);
