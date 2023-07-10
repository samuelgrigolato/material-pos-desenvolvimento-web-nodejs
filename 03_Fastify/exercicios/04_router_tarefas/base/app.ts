import fastify from 'fastify';

import { consultarTarefaPeloId, cadastrarTarefa, consultarTarefas, DadosTarefa } from './tarefas/model';
import { recuperarUsuarioAutenticado } from './usuarios/model';
import usuariosRouter from './usuarios/router';
import { ErroNoProcessamento } from './shared/erros';

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

app.addHook('preHandler', async (req, resp) => {
  const { authorization } = req.headers as { authorization?: string };
  if (authorization !== undefined) {
    const token = authorization.replace('Bearer ', '');
    const usuario = await recuperarUsuarioAutenticado(token);
    req.usuario = usuario;
  }
  // não queremos disparar um erro se o usuário não estiver autenticado neste ponto,
  // pois algumas rotas podem ser públicas
});

app.post('/tarefas', async (req, resp) => {
  const dados = req.body as DadosTarefa;
  const id = await cadastrarTarefa(req.usuario, dados);
  resp.status(201);
  return { id };
});

app.get('/tarefas', async (req, resp) => {
  const { termo } = req.query as { termo?: string };
  const tarefas = await consultarTarefas(req.usuario, termo);
  return tarefas;
});

app.get('/tarefas/:id', async (req, resp) => {
  const { id } = req.params as { id: string };
  const idTarefa = Number(id);
  const tarefa = await consultarTarefaPeloId(req.usuario, idTarefa);
  return tarefa;
});

app.register(usuariosRouter, { prefix: '/usuarios' });

async function main() {
  try {
    await app.listen({ port: 3000 });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}
main();
