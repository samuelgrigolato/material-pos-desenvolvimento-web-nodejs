import express from 'express';
import cors from 'cors';

import asyncWrapper from './async-wrapper.js';
import { cadastrarTarefa, consultarTarefas } from './tarefas/model.js';
import { autenticar, recuperarUsuarioAutenticado } from './usuarios/model.js';

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
    const usuario = await recuperarUsuarioAutenticado(autenticacao);
    req.usuario = usuario;
  }
  next();
}));

app.use((req, _res, next) => {
  const contentType = req.headers['content-type'];
  if (contentType !== undefined && !contentType.startsWith('application/json')) {
    next({
      message: 'Formato inválido.',
      statusCode: 400
    });
  } else {
    next();
  }
});

app.use(express.json());

app.post('/tarefas', asyncWrapper(async (req, res) => {
  const tarefa = req.body;
  const id = await cadastrarTarefa(tarefa, req.usuario);
  res.status(201).send({ id });
}));

app.get('/tarefas', asyncWrapper(async (req, res) => {
  const termo = req.query.termo;
  const tarefas = await consultarTarefas(termo, req.usuario);
  res.send(tarefas);
}));

app.post('/usuarios/login', asyncWrapper(async (req, res) => {
  const { login, senha } = req.body;
  const autenticacao = await autenticar(login, senha);
  res.send({ token: autenticacao });
}));

app.use((_req, res) => {
  res.status(404).send({
    razao: 'Rota não encontrada.'
  });
});

app.use((err, _req, res, _next) => {
  let resposta;
  if (err.codigo) {
    resposta = {
      codigo: err.codigo,
      descricao: err.message
    };
  } else {
    const razao = err.message || err;
    resposta = { razao };
  }
  const statusCode = err.statusCode || 500;
  res.status(statusCode).send(resposta);
});

app.listen(8080);
