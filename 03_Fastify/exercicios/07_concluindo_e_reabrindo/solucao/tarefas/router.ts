import { FastifyInstance, FastifySchema } from 'fastify';

import { consultarTarefaPeloId, cadastrarTarefa, consultarTarefas, DadosTarefa, concluirTarefa, reabrirTarefa } from './model';

export default async (app: FastifyInstance) => {

  const postSchema: FastifySchema = {
    body: {
      type: 'object',
      properties: {
        descricao: { type: 'string' },
      },
      required: ['descricao'],
      additionalProperties: false,
    },
    response: {
      201: {
        type: 'object',
        properties: {
          id: { type: 'number' },
        },
        required: ['id'],
      },
    },
  };

  app.post('/', { schema: postSchema }, async (req, resp) => {
    const dados = req.body as DadosTarefa;
    const id = await cadastrarTarefa(req.usuario, dados);
    resp.status(201);
    return { id };
  });
  
  app.get('/', async (req, resp) => {
    const { termo } = req.query as { termo?: string };
    const tarefas = await consultarTarefas(req.usuario, termo);
    return tarefas;
  });
  
  app.get('/:id', async (req, resp) => {
    const { id } = req.params as { id: string };
    const idTarefa = Number(id);
    const tarefa = await consultarTarefaPeloId(req.usuario, idTarefa);
    return tarefa;
  });

  app.post('/:id/concluir', async (req, resp) => {
    const { id } = req.params as { id: string };
    const idTarefa = Number(id);
    await concluirTarefa(req.usuario, idTarefa);
    resp.status(204);
  });

  app.post('/:id/reabrir', async (req, resp) => {
    const { id } = req.params as { id: string };
    const idTarefa = Number(id);
    await reabrirTarefa(req.usuario, idTarefa);
    resp.status(204);
  });

}
