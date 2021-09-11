import express from 'express';

import { cadastrarTarefa, consultarTarefas } from './tarefas/model.js';

const app = express();
app.use(express.json());

app.use((_req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  next();
});

app.post('/tarefas', (req, res, next) => {
  const tarefa = req.body;
  cadastrarTarefa(tarefa)
    .then(id => {
      res.status(201).send({ id });
    })
    .catch(next);
});

app.get('/tarefas', (req, res, next) => {
  const termo = req.query.termo;
  consultarTarefas(termo)
    .then(tarefas => res.send(tarefas))
    .catch(next);
});

app.listen(8080);
