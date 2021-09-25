import express from 'express';

import asyncWrapper from '../async-wrapper.js';
import { DadosOuEstadoInvalido } from '../erros.js';
import { cadastrarTarefa, consultarTarefas } from './model.js';
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

export default router;
