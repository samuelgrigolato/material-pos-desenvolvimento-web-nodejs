import fastify from 'fastify';
import fileUpload from 'fastify-file-upload';
import cors from '@fastify/cors';

import uowPlugin from './core/uow';
import openai from './chatbot/openai';
import papagaio from './chatbot/papagaio';
import chatbotPlugin from './chatbot/fastify-plugin';
import { recuperarUsuarioAutenticado } from './usuarios/model';
import usuariosRouter from './usuarios/router';
import tarefasRouter from './tarefas/router';
import etiquetasRouter from './etiquetas/router';
import categoriasRouter from './categorias/router';
import { ErroNoProcessamento } from './shared/erros';


const app = fastify({ logger: true });
app.register(cors, {
  origin: true
});

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
app.register(chatbotPlugin(openai));
// app.register(chatbotPlugin(papagaio));
app.register(uowPlugin);
app.register(fileUpload, {
  debug: true,
  limits: { fileSize: 50 * 1024 * 1024 },
});

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

async function main() {
  try {
    await app.listen({ port: 3000, host: '0.0.0.0' });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}
main();
