import express from 'express';

import asyncWrapper from '../async-wrapper.js';
import { buscarEtiquetas } from './model.js';


const router = express.Router();

router.get('', asyncWrapper(async (_req, res) => {
  const etiquetas = await buscarEtiquetas();
  res.send(etiquetas);
}));

export default router;
