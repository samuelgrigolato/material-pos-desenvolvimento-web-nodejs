import { FastifyInstance } from 'fastify';
import fastifyPlugin from 'fastify-plugin';

import { Chatbot } from './api';


export default (chatbot: Chatbot) => fastifyPlugin(async (app: FastifyInstance) => {
  app.decorateRequest('chatbot', null);
  app.addHook('preHandler', (req, _, done) => {
    req.chatbot = chatbot;
    done();
  });
});
