import { FastifyInstance } from 'fastify';

import {
  buscarEtiquetas
} from './model';

export default async (app: FastifyInstance) => {

  app.get('/', async (req) => {
    const etiquetas = await buscarEtiquetas(req.uow);
    return etiquetas;
  });

};
