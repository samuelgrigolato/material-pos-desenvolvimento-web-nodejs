import fastify, { FastifyPluginCallback } from 'fastify';

import { Chatbot } from './chatbot/api';
import chatbotPlugin from './chatbot/fastify-plugin';
import { recuperarUsuarioAutenticado } from './usuarios/model';
import usuariosRouter from './usuarios/router';
import tarefasRouter from './tarefas/router';
import etiquetasRouter from './etiquetas/router';
import categoriasRouter from './categorias/router';
import { ErroNoProcessamento } from './shared/erros';


export default (uowPlugin: FastifyPluginCallback, chatbot: Chatbot) => {
  const app = fastify({ logger: true });

  app.setNotFoundHandler((req, resp) => {
    resp.status(404).send({ erro: 'Rota não encontrada' });
  });

  app.removeContentTypeParser('text/plain');

  app.setErrorHandler((err, req, resp) => {
    if (err instanceof ErroNoProcessamento) {
      resp.status(err.statusCode).send(err.toJSON());
    } else {
      resp.send(err); // isso delega o tratamento de erro para o handler padrão do Fastify
    }
  });

  app.decorateRequest('usuario', null);
  app.register(chatbotPlugin(chatbot));
  app.register(uowPlugin);

  app.addHook('preHandler', async (req, resp) => {
    const { authorization } = req.headers as { authorization?: string };
    if (authorization !== undefined) {
      const token = authorization.replace('Bearer ', '');
      const usuario = await recuperarUsuarioAutenticado(token, req.uow);
      req.usuario = usuario;
    }
    // não queremos disparar um erro se o usuário não estiver autenticado neste ponto,
    // pois algumas rotas podem ser públicas
  });

  app.register(usuariosRouter, { prefix: '/usuarios' });
  app.register(tarefasRouter, { prefix: '/tarefas' });
  app.register(etiquetasRouter, { prefix: '/etiquetas' });
  app.register(categoriasRouter, { prefix: '/categorias' });
  
  return app;
};
