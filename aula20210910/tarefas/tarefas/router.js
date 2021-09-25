import express from 'express';

import asyncWrapper from '../async-wrapper.js';
import autenticado from '../autenticado.js';
import { cadastrarTarefa, concluirTarefa, consultarTarefas } from './model.js';
import schemaValidator from '../schema-validator.js';


const router = express.Router();

router.post(
  '',
  schemaValidator({
    type: 'object',
    properties: {
      descricao: { type: 'string' }
    },
    required: [ 'descricao' ],
    additionalProperties: false
  }),
  asyncWrapper(async (req, res) => {
    const tarefa = req.body;
    const id = await cadastrarTarefa(tarefa, req.usuario);
    res.status(201).send({ id });
  })
);

router.get('', asyncWrapper(async (req, res) => {
  const termo = req.query.termo;
  const tarefas = await consultarTarefas(termo, req.usuario);
  res.send(tarefas);
}));

router.post('/:id/concluir', autenticado, asyncWrapper(async (req, res) => {
  await concluirTarefa(req.params.id, req.usuario);
  res.sendStatus(204);
}));

export default router;
