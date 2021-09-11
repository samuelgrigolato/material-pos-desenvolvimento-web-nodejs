import express from 'express';

import asyncWrapper from './async-wrapper.js';
import { cadastrarTarefa, consultarTarefas } from './tarefas/model.js';

const app = express();
app.use(express.json());

app.use((_req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  next();
});

app.post('/tarefas', asyncWrapper(async (req, res) => {
  const tarefa = req.body;
  const id = await cadastrarTarefa(tarefa);
  res.status(201).send({ id });
}));

app.get('/tarefas', asyncWrapper(async (req, res) => {
  const termo = req.query.termo;
  const tarefas = await consultarTarefas(termo);
  res.send(tarefas);
}));

app.listen(8080);
