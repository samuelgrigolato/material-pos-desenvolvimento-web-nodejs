const http = require('http');

const COTACOES = {
  'BRL': {
    'USD': 0.25,
    'EUR': 0.22,
  },
  'USD': {
    'BRL': 4.00,
    'EUR': 0.88,
  },
  'EUR': {
    'BRL': 4.51,
    'USD': 1.13,
  },
};

const server = http.createServer(function (req, res) {
  const url = req.url;
  const moeda = url.substring(url.length - 3);
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  let response;
  if (moeda in COTACOES) {
    response = {
      result: 'success',
      rates: COTACOES[moeda],
    };
  } else {
    response = {
      result: 'error',
      "error-type": 'moeda não encontrada',
    };
  }
  res.write(JSON.stringify(response));
  res.end();
});

server.listen(8081);
