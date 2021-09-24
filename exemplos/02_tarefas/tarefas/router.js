import express from 'express';

import asyncWrapper from '../async-wrapper.js';
import { comUnidadeDeTrabalho } from '../querybuilder.js';
import schemaValidator from '../schema-validator.js';
import {
  buscarTarefa, cadastrarTarefa, alterarTarefa, concluirTarefa,
  consultarTarefas, contarTarefasAbertas, reabrirTarefa,
  deletarTarefa, vincularEtiqueta, desvincularEtiqueta
} from './model.js';

const router = express.Router();

const tarefaSchema = {
  type: 'object',
  properties: {
    descricao: { type: 'string' },
    id_categoria: { type: 'number' }
  },
  required: [ 'descricao', 'id_categoria' ]
};

const tarefaPatchSchema = {
  type: 'object',
  properties: {
    descricao: { type: 'string' },
    id_categoria: { type: 'number' }
  },
  required: []
};

const vincularEtiquetaSchema = {
  type: 'object',
  properties: {
    etiqueta: { type: 'string' }
  },
  required: [ 'etiqueta' ]
};

router.post('', schemaValidator(tarefaSchema), asyncWrapper(async (req, res) => {
  const tarefa = req.body;
  const id = await cadastrarTarefa(tarefa, req.loginDoUsuario);
  res.send({ id });
}));

router.get('', asyncWrapper(async (req, res) => {
  const termo = req.query.termo;
  const tarefas = await consultarTarefas(termo, req.loginDoUsuario);
  res.send(tarefas);
}));

router.get('/:id', asyncWrapper(async (req, res) => {
  const tarefa = await buscarTarefa(req.params.id, req.loginDoUsuario);
  res.send(tarefa);
}));

router.patch('/:id', schemaValidator(tarefaPatchSchema), asyncWrapper(async (req, res) => {
  const patch = req.body;
  await alterarTarefa(req.params.id, patch, req.loginDoUsuario);
  res.sendStatus(204);
}));

router.post('/:id/concluir', asyncWrapper(async (req, res) => {
  await concluirTarefa(req.params.id, req.loginDoUsuario);
  res.sendStatus(204);
}));

router.delete('/:id', asyncWrapper(async (req, res) => {
  await deletarTarefa(req.params.id, req.loginDoUsuario);
  res.sendStatus(204);
}));

router.post('/:id/reabrir', asyncWrapper(async (req, res) => {
  await reabrirTarefa(req.params.id, req.loginDoUsuario);
  res.sendStatus(204);
}));

router.get('/abertas/quantidade', asyncWrapper(async (req, res) => {
  const quantidade = await contarTarefasAbertas(req.loginDoUsuario);
  res.json(quantidade);
}));

router.post('/:id/etiquetas', schemaValidator(vincularEtiquetaSchema), comUnidadeDeTrabalho(), asyncWrapper(async (req, res) => {
  await vincularEtiqueta(req.params.id, req.body.etiqueta, req.loginDoUsuario, req.uow);
  res.sendStatus(204);
}));

router.delete('/:id/etiquetas/:descricao', comUnidadeDeTrabalho(), asyncWrapper(async (req, res) => {
  await desvincularEtiqueta(req.params.id, req.params.descricao, req.loginDoUsuario, req.uow);
  res.sendStatus(204);
}));

export default router;
