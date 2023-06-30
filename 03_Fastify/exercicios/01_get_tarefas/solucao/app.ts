import fastify from 'fastify';

import { cadastrarTarefa, consultarTarefas, DadosTarefa } from './tarefas/model';

const app = fastify({ logger: true });

app.post('/tarefas', async (req, resp) => {
  const dados = req.body as DadosTarefa;
  const id = await cadastrarTarefa(dados);
  resp.status(201);
  return { id };
});

app.get('/tarefas', async (req, resp) => {
  const { termo } = req.query as { termo?: string };
  const tarefas = await consultarTarefas(termo);
  return tarefas;
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
