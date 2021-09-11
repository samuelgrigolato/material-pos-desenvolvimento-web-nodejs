import express from 'express';

import { cadastrarTarefa } from './tarefas/model.js';

const app = express();
app.use(express.json());

app.post('/tarefas', (req, res, next) => {
  const tarefa = req.body;
  cadastrarTarefa(tarefa)
    .then(id => {
      res.status(201).send({ id });
    })
    .catch(err => {
      next(err);
    });
});

app.listen(8080);
