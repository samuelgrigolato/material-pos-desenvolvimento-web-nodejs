import express from 'express';

const app = express();

app.use((_req, res, next) => {
  res.on('finish', () => {
    console.log('middleware2-fim-de-verdade');
  });
  console.log('middleware1-inicio');
  next();
  console.log('middleware2-fim');
});

app.get('/usuario', (_req, res, next) => {
  console.log('endpoint-inicio');
  setTimeout(() => {
    next(new Error('teste'));
    // res.send({
    //   login: 'alguem',
    //   nome: 'Alguém'
    // });
    // console.log('endpoint-fim-de-verdade');
  }, 1000);
  console.log('endpoint-fim');
});

app.use((err, _req, res, _next) => {
  const razao = err.message || err;
  res.status(500).send({ razao });
});

app.listen(8080);
