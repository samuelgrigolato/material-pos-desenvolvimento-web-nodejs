import { FastifyInstance } from 'fastify';

import { consultarTarefaPeloId, cadastrarTarefa, consultarTarefas, DadosTarefa } from './model';

export default async (app: FastifyInstance) => {

  app.post('/', async (req, resp) => {
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

}
