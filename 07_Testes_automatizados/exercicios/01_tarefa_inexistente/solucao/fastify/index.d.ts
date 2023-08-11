import fastify from 'fastify'; // essa linha é muito importante! caso contrário ocorre uma substituição/shadowing do módulo fastify
import { Knex } from 'knex';
import { Usuario } from 'usuarios/model';
import { Chatbot } from 'chatbot/api';

declare module 'fastify' {
  interface FastifyRequest {
    usuario: Usuario | null;

    // tecnicamente existe um período no ciclo de vida onde uow ainda não existe,
    // mas vamos ignorar isso aqui para simplificar o código dos handlers
    uow: Knex.Transaction;

    chatbot: Chatbot;
  }
}
