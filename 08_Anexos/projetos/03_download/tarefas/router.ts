import { FastifyInstance, FastifySchema } from 'fastify';
import { createReadStream } from 'fs';
import { mkdir, rm } from 'fs/promises';

import {
  consultarTarefaPeloId, cadastrarTarefa, consultarTarefas,
  DadosTarefa, concluirTarefa, reabrirTarefa, alterarTarefa,
  excluirTarefa, vincularEtiquetaNaTarefa, desvincularEtiquetaDaTarefa,
  planejarTarefasDoProjeto, sugerirProximaTarefa, estimarTextual,
  estimar, cadastrarAnexo, excluirAnexo, consultarAnexoPeloId,
} from './model';

export default async (app: FastifyInstance) => {

  const postSchema: FastifySchema = {
    body: {
      type: 'object',
      properties: {
        descricao: { type: 'string' },
        id_categoria: { type: 'number' },
      },
      required: ['descricao', 'id_categoria'],
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
    const id = await cadastrarTarefa(req.usuario, dados, req.uow);
    resp.status(201);
    return { id };
  });
  
  app.get('/', async (req, resp) => {
    const { termo } = req.query as { termo?: string };
    const tarefas = await consultarTarefas(req.usuario, termo, req.uow);
    return tarefas;
  });
  
  app.get('/:id', async (req, resp) => {
    const { id } = req.params as { id: string };
    const idTarefa = Number(id);
    const tarefa = await consultarTarefaPeloId(req.usuario, idTarefa, req.uow);
    return {
      descricao: tarefa.descricao,
      data_conclusao: tarefa.data_conclusao,
      id_categoria: tarefa.id_categoria,
      etiquetas: tarefa.etiquetas,
    };
  });

  app.patch('/:id', async (req, resp) => {
    const { id } = req.params as { id: string };
    const idTarefa = Number(id);
    const alteracoes = req.body as Partial<DadosTarefa>;
    await alterarTarefa(req.usuario, idTarefa, alteracoes, req.uow);
    resp.status(204);
  });

  app.post('/:id/concluir', async (req, resp) => {
    const { id } = req.params as { id: string };
    const idTarefa = Number(id);
    await concluirTarefa(req.usuario, idTarefa, req.uow);
    resp.status(204);
  });

  app.post('/:id/reabrir', async (req, resp) => {
    const { id } = req.params as { id: string };
    const idTarefa = Number(id);
    await reabrirTarefa(req.usuario, idTarefa, req.uow);
    resp.status(204);
  });

  app.delete('/:id', async (req, resp) => {
    const { id } = req.params as { id: string };
    const idTarefa = Number(id);
    await excluirTarefa(req.usuario, idTarefa, req.uow);
    resp.status(204);
  });

  app.post('/:id/etiquetas/:etiqueta', async (req, resp) => {
    const { id, etiqueta } = req.params as { id: string, etiqueta: string };
    const idTarefa = Number(id);
    await vincularEtiquetaNaTarefa(req.usuario, idTarefa, etiqueta, req.uow);
    resp.status(204);
  });

  app.delete('/:id/etiquetas/:etiqueta', async (req, resp) => {
    const { id, etiqueta } = req.params as { id: string, etiqueta: string };
    const idTarefa = Number(id);
    await desvincularEtiquetaDaTarefa(req.usuario, idTarefa, etiqueta, req.uow);
    resp.status(204);
  });

  const planejarProjetoSchema: FastifySchema = {
    body: {
      type: 'object',
      properties: {
        descricao: { type: 'string' },
      },
      required: [ 'descricao' ],
    },
  };

  app.post('/planejar-projeto', { schema: planejarProjetoSchema }, async (req) => {
    const { descricao } = req.body as { descricao: string };
    const sugestoesDeTarefa = await planejarTarefasDoProjeto(descricao, req.chatbot);
    return sugestoesDeTarefa;
  });

  app.post('/sugerir-proxima', async (req) => {
    const sugestaoDeTarefa = await sugerirProximaTarefa(req.usuario, req.uow, req.chatbot);
    return {
      descricao: sugestaoDeTarefa,
    };
  });

  app.post('/:id/estimar-textual', async (req, resp) => {
    const { id } = req.params as { id: string };
    const idTarefa = Number(id);
    const estimativa = await estimarTextual(req.usuario, idTarefa, req.uow, req.chatbot);
    return { estimativa };
  });

  app.post('/:id/estimar', async (req, resp) => {
    const { id } = req.params as { id: string };
    const idTarefa = Number(id);
    return await estimar(req.usuario, idTarefa, req.uow, req.chatbot);
  });

  app.post('/:id/anexos', async (req, resp) => {
    const { id } = req.params as { id: string };
    const idTarefa = Number(id);
    const arquivo = (req.raw as any).files.arquivo; // suporte TypeScript da biblioteca está incompleto
    const idAnexo = await cadastrarAnexo(
      req.usuario,
      idTarefa,
      arquivo.name,
      arquivo.size,
      arquivo.mimetype,
      req.uow
    );
    await mkdir('uploads', { recursive: true }); // recursive faz com que ignore se já existir
    await arquivo.mv(`uploads/${idAnexo}`);
    return { id: idAnexo };
  });

  app.delete('/:id/anexos/:idAnexo', async (req, resp) => {
    const { id, idAnexo } = req.params as { id: string, idAnexo: string };
    const idTarefa = Number(id);
    await excluirAnexo(req.usuario, idTarefa, idAnexo, req.uow);
    await rm(`uploads/${idAnexo}`);
    resp.status(204);
  });

  app.get('/:id/anexos/:idAnexo', async (req, resp) => {
    const { id, idAnexo } = req.params as { id: string, idAnexo: string };
    const idTarefa = Number(id);
    const anexo = await consultarAnexoPeloId(req.usuario, idTarefa, idAnexo, req.uow);
    resp.header('Content-Type', anexo.mime_type);
    resp.header('Content-Length', anexo.tamanho);
    await resp.send(createReadStream(`uploads/${idAnexo}`)); // a documentação pede o await aqui
  });

}
