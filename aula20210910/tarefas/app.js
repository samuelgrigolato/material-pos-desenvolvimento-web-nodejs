import express from 'express';
import cors from 'cors';

import asyncWrapper from './async-wrapper.js';
import { cadastrarTarefa, consultarTarefas } from './tarefas/model.js';
import { autenticar, recuperarLoginDoUsuarioAutenticado } from './usuarios/model.js';

const app = express();
app.use(cors());

app.use((req, res, next) => {
  res.on('finish', () => {
    console.log(new Date().toISOString(), `[${req.method}]`, req.url, res.statusCode);
  });
  next();
});

app.use(asyncWrapper(async (req, _res, next) => {
  const authorization = req.headers['authorization'];
  const match = /^Bearer (.*)$/.exec(authorization);
  if (match) {
    const autenticacao = match[1];
    const login = await recuperarLoginDoUsuarioAutenticado(autenticacao);
    req.loginDoUsuario = login;
  }
  next();
}));

app.use(express.json());

app.post('/tarefas', asyncWrapper(async (req, res) => {
  const tarefa = req.body;
  const id = await cadastrarTarefa(tarefa, req.loginDoUsuario);
  res.status(201).send({ id });
}));

app.get('/tarefas', asyncWrapper(async (req, res) => {
  const termo = req.query.termo;
  const tarefas = await consultarTarefas(termo, req.loginDoUsuario);
  res.send(tarefas);
}));

app.post('/usuarios/login', asyncWrapper(async (req, res) => {
  const { login, senha } = req.body;
  const autenticacao = await autenticar(login, senha);
  res.send({ token: autenticacao });
}));

app.use((err, _req, res, _next) => {
  const razao = err.message || err;
  res.status(500).send({ razao });
});

app.listen(8080);
