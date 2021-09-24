import express from 'express';

import asyncWrapper from '../async-wrapper.js';
import { comUnidadeDeTrabalho } from '../querybuilder.js';
import { buscarCategorias } from './model.js';

const router = express.Router();

router.get('', comUnidadeDeTrabalho(), asyncWrapper(async (req, res) => {
  const categorias = await buscarCategorias(req.uow);
  res.send(categorias);
}));

export default router;
