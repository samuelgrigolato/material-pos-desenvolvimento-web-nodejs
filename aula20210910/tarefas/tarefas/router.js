import express from 'express';

import asyncWrapper from '../async-wrapper.js';
import autenticado from '../autenticado.js';
import {
  cadastrarTarefa, concluirTarefa,
  consultarTarefas, reabrirTarefa,
  alterarTarefa, excluirTarefa, vincularEtiqueta
} from './model.js';
import schemaValidator from '../schema-validator.js';
import { comUnidadeDeTrabalho } from '../querybuilder.js';


const router = express.Router();

router.post(
  '',
  schemaValidator({
    type: 'object',
    properties: {
      descricao: { type: 'string' },
      id_categoria: { type: 'number' }
    },
    required: [ 'descricao', 'id_categoria' ],
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

router.patch('/:id',
  autenticado,
  schemaValidator({
    type: 'object',
    properties: {
      descricao: { type: 'string' },
      id_categoria: { type: 'number' }
    },
    additionalProperties: false
  }),
  asyncWrapper(async (req, res) => {
    const idTarefa = req.params.id;
    const patch = req.body;
    await alterarTarefa(idTarefa, patch, req.usuario);
    res.sendStatus(204);
  })
);

router.delete('/:id',
  autenticado,
  asyncWrapper(async (req, res) => {
    const idTarefa = req.params.id;
    await excluirTarefa(idTarefa, req.usuario);
    res.sendStatus(204);
  })
);

router.post('/:id/concluir',
  autenticado,
  asyncWrapper(async (req, res) => {
    await concluirTarefa(req.params.id, req.usuario);
    res.sendStatus(204);
  })
);

router.post('/:id/reabrir', autenticado, asyncWrapper(async (req, res) => {
  await reabrirTarefa(req.params.id, req.usuario);
  res.sendStatus(204);
}));

router.post(
  '/:id/etiquetas',
  autenticado,
  schemaValidator({
    type: 'object',
    properties: {
      etiqueta: { type: 'string' }
    },
    required: ['etiqueta'],
    additionalProperties: false
  }),
  comUnidadeDeTrabalho(),
  asyncWrapper(async (req, res) => {
    await vincularEtiqueta(req.params.id, req.body.etiqueta, req.usuario, req.uow);
    res.sendStatus(204);
  })
);

export default router;
