import { FastifyInstance } from 'fastify';
import fastifyPlugin from 'fastify-plugin';

import knex from '../shared/querybuilder';


export default fastifyPlugin(async (app: FastifyInstance) => {
  app.decorateRequest('uow', null);

  app.addHook('preHandler', (req, _, done) => {
    knex.transaction(trx => {
      req.uow = trx;
      done();
    });
  });

  app.addHook('onSend', async (req) => {
    if (req.uow && !req.uow.isCompleted()) {
      console.log('commit');
      await req.uow.commit();
    }
  });

  app.addHook('onError', async (req) => {
    console.log('rollback');
    await req.uow.rollback();
  });

});
