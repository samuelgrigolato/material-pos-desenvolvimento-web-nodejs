import express from 'express';

import asyncWrapper from '../async-wrapper.js';
import { cadastrarTarefa, consultarTarefas } from './model.js';


const router = express.Router();

router.post('', asyncWrapper(async (req, res) => {
  const tarefa = req.body;
  const id = await cadastrarTarefa(tarefa, req.usuario);
  res.status(201).send({ id });
}));

router.get('', asyncWrapper(async (req, res) => {
  const termo = req.query.termo;
  const tarefas = await consultarTarefas(termo, req.usuario);
  res.send(tarefas);
}));

export default router;
