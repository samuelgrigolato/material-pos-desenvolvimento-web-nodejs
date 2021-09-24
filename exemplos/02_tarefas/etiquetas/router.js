import express from 'express';

import asyncWrapper from '../async-wrapper.js';
import { comUnidadeDeTrabalho } from '../querybuilder.js';
import { buscarEtiquetas } from './model.js';

const router = express.Router();

router.get('', comUnidadeDeTrabalho(), asyncWrapper(async (req, res) => {
  const etiquetas = await buscarEtiquetas(req.uow);
  res.send(etiquetas);
}));

export default router;
