import { FastifyInstance } from 'fastify';

import {
  buscarCategorias
} from './model';

export default async (app: FastifyInstance) => {

  app.get('/', async (req) => {
    const categorias = await buscarCategorias(req.uow);
    return categorias;
  });

};
