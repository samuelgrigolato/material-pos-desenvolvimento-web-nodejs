import express from 'express';

const app = express();

app.use((req, res, next) => {
  res.on("finish", () => {
    const date = new Date();
    date.toISOString();
    console.log(`${date.toISOString()} [${req.method}] ${req.path} ${res.statusCode}`);
  });
  next();
});

app.get('/usuario', (_req, res) => {
  setTimeout(() => {
    res.send({
      nome: "Alguém"
    });
  }, Math.random() * 1000);
});

app.listen(8080);
