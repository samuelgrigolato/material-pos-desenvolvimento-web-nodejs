import fastify from 'fastify';

import { cadastrarTarefa, consultarTarefas, DadosTarefa } from './tarefas/model';
import { autenticar, recuperarLoginDoUsuarioAutenticado } from './usuarios/model';

const app = fastify({ logger: true });

app.decorateRequest('loginDoUsuario', null);

app.addHook('preHandler', async (req, resp) => {
  const { authorization } = req.headers as { authorization?: string };
  if (authorization !== undefined) {
    const token = authorization.replace('Bearer ', '');
    const login = await recuperarLoginDoUsuarioAutenticado(token);
    req.loginDoUsuario = login;
  }
  // não queremos disparar um erro se o usuário não estiver autenticado neste ponto,
  // pois algumas rotas podem ser públicas
});

app.post('/tarefas', async (req, resp) => {
  const dados = req.body as DadosTarefa;
  const id = await cadastrarTarefa(req.loginDoUsuario, dados);
  resp.status(201);
  return { id };
});

app.get('/tarefas', async (req, resp) => {
  const { termo } = req.query as { termo?: string };
  const tarefas = await consultarTarefas(req.loginDoUsuario, termo);
  return tarefas;
});

app.post('/usuarios/login', async (req, resp) => {
  const { login, senha } = req.body as { login: string, senha: string };
  const id = await autenticar(login, senha);
  return { token: id };
});

async function main() {
  try {
    await app.listen({ port: 3000 });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}
main();
