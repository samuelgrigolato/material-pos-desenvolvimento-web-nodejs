import express from 'express';

import asyncWrapper from '../async-wrapper.js';
import schemaValidator from '../schema-validator.js';
import { DadosOuEstadoInvalido } from '../erros.js';
import { buscarTarefa, cadastrarTarefa, concluirTarefa, consultarTarefas, contarTarefasAbertas } from './model.js';

const router = express.Router();

const tarefaSchema = {
  type: 'object',
  properties: {
    descricao: { type: 'string' }
  },
  required: [ 'descricao' ]
};

router.post('', schemaValidator(tarefaSchema), asyncWrapper(async (req, res) => {
  if (!tarefaSchemaValidator(req.body)) {
    throw new DadosOuEstadoInvalido('FalhouValidacaoEsquema', ajv.errorsText(tarefaSchemaValidator.errors), tarefaSchemaValidator.errors);
  }
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

router.post('/:id/concluir', asyncWrapper(async (req, res) => {
  await concluirTarefa(req.params.id, req.loginDoUsuario);
  res.sendStatus(204);
}));

router.get('/abertas/quantidade', asyncWrapper(async (req, res) => {
  const quantidade = await contarTarefasAbertas(req.loginDoUsuario);
  res.json(quantidade);
}));

export default router;
