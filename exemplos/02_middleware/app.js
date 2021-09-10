import express from 'express';

const app = express();

app.use((_req, res, next) => {
  console.log('middleware1-inicio');
  next();
  // console.log('middleware1-fim');
  res.on("finish", () => {
    console.log('middleware1-fim');
  });
});

app.use((_req, _res, next) => {
  console.log('middleware2-inicio');
  setTimeout(() => {
    next();
    console.log('middleware2-fim'); // não vai fazer o que você espera se for async
  }, Math.random() * 1000);
});

app.get('/usuario', (req, res) => {
  console.log('endpoint-inicio');
  if (req.query.forcarErro === "X") {
    throw Error('Erro forçado.');
  }
  res.send({
    login: 'alguem',
    nome: 'Alguém'
  });
  console.log('endpoint-fim');
});

app.use((err, _req, res, _next) => {
  res.status(500).send({
    razao: err.message
  });
});

app.listen(8080);
