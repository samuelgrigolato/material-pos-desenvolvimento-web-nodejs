import { FastifyInstance } from 'fastify';
import fastifyPlugin from 'fastify-plugin';
import { Knex } from 'knex';

import knex from '../shared/querybuilder';
import papagaio from '../chatbot/papagaio';
import appFactory from '../app-factory';
import { gerarToken } from './model';


const testUowPlugin = (trx: Knex.Transaction) =>
  fastifyPlugin(async (app: FastifyInstance) => {
    app.decorate('uow');
    app.addHook('onRequest', async (req) => {
      req.uow = trx;
    });
  });


describe('usuarios/router', () => {

  describe('PUT /usuarios/autenticado/nome', () => {

    it('deve alterar o nome do usuário logado', async () => {
      await knex.transaction(async (trx) => {
        await trx('usuarios')
          .insert({
            id: -1,
            nome: 'Fulano',
            senha: '???',
            admin: false,
            login: 'fulano',
          });

        const app = appFactory(testUowPlugin(trx), papagaio);
        const resp = await app.inject({
          method: 'PUT',
          path: '/usuarios/autenticado/nome',
          headers: {
            'content-type': 'application/json',
            'authorization': `Bearer ${gerarToken('fulano')}`
          },
          payload: { nome: 'Onaluf' },
        });

        expect(resp.statusCode).toEqual(204);

        const res = await trx('usuarios')
          .select('nome')
          .where({ login: 'fulano' });
        expect(res[0].nome).toEqual('Onaluf');

        await trx.rollback(); // uma exceção já vai dar rollback
      });
    });

  });

});
