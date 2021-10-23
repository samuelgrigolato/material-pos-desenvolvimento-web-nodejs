import express from 'express';
import fs from 'fs/promises';
import asyncDownload from '../async-download.js';

import asyncWrapper from '../async-wrapper.js';
import { comUnidadeDeTrabalho } from '../querybuilder.js';
import schemaValidator from '../schema-validator.js';
import {
  buscarTarefa, cadastrarTarefa, alterarTarefa, concluirTarefa,
  consultarTarefas, contarTarefasAbertas, reabrirTarefa,
  deletarTarefa, vincularEtiqueta, desvincularEtiqueta, cadastrarAnexo,
  excluirAnexo, consultarNomeDoAnexo
} from './model.js';

const router = express.Router();

const tarefaSchema = {
  type: 'object',
  properties: {
    descricao: { type: 'string' },
    id_categoria: { type: 'number' }
  },
  required: [ 'descricao', 'id_categoria' ]
};

const tarefaPatchSchema = {
  type: 'object',
  properties: {
    descricao: { type: 'string' },
    id_categoria: { type: 'number' }
  },
  required: []
};

const vincularEtiquetaSchema = {
  type: 'object',
  properties: {
    etiqueta: { type: 'string' }
  },
  required: [ 'etiqueta' ]
};

router.post('', schemaValidator(tarefaSchema), asyncWrapper(async (req, res) => {
  const tarefa = req.body;
  const id = await cadastrarTarefa(tarefa, req.loginDoUsuario);
  res.send({ id });
}));

router.get('', asyncWrapper(async (req, res) => {
  const termo = req.query.termo;
  const tarefas = await consultarTarefas(termo, req.loginDoUsuario);
  // as linhas abaixo habilitam cache no nível HTTP, use com cuidado
  //res.append('Cache-Control', 'max-age=2');
  //res.append('Cache-Control', 'no-store');
  res.send(tarefas);
}));

router.get('/:id', asyncWrapper(async (req, res) => {
  const tarefa = await buscarTarefa(req.params.id, req.loginDoUsuario);
  res.send(tarefa);
}));

router.patch('/:id', schemaValidator(tarefaPatchSchema), asyncWrapper(async (req, res) => {
  const patch = req.body;
  await alterarTarefa(req.params.id, patch, req.loginDoUsuario);
  res.sendStatus(204);
}));

router.post('/:id/concluir', asyncWrapper(async (req, res) => {
  await concluirTarefa(req.params.id, req.loginDoUsuario);
  res.sendStatus(204);
}));

router.delete('/:id', asyncWrapper(async (req, res) => {
  await deletarTarefa(req.params.id, req.loginDoUsuario);
  res.sendStatus(204);
}));

router.post('/:id/reabrir', asyncWrapper(async (req, res) => {
  await reabrirTarefa(req.params.id, req.loginDoUsuario);
  res.sendStatus(204);
}));

router.get('/abertas/quantidade', asyncWrapper(async (req, res) => {
  const quantidade = await contarTarefasAbertas(req.loginDoUsuario);
  res.json(quantidade);
}));

router.post('/:id/etiquetas', schemaValidator(vincularEtiquetaSchema), comUnidadeDeTrabalho(), asyncWrapper(async (req, res) => {
  await vincularEtiqueta(req.params.id, req.body.etiqueta, req.loginDoUsuario, req.uow);
  res.sendStatus(204);
}));

router.delete('/:id/etiquetas/:descricao', comUnidadeDeTrabalho(), asyncWrapper(async (req, res) => {
  await desvincularEtiqueta(req.params.id, req.params.descricao, req.loginDoUsuario, req.uow);
  res.sendStatus(204);
}));

router.post('/:id/anexos', comUnidadeDeTrabalho(), asyncWrapper(async (req, res) => {
  const arquivo = req.files.arquivo;
  const idAnexo = await cadastrarAnexo(
    req.params.id,
    arquivo.name,
    arquivo.size,
    arquivo.mimetype,
    req.loginDoUsuario,
    req.uow
  );
  await arquivo.mv(`uploads/${idAnexo}`);
  res.json({ id: idAnexo });
}));

router.delete('/:id/anexos/:idAnexo', comUnidadeDeTrabalho(), asyncWrapper(async (req, res) => {
  const idAnexo = parseInt(req.params.idAnexo);
  await excluirAnexo(
    parseInt(req.params.id),
    idAnexo,
    req.loginDoUsuario,
    req.uow
  );
  await fs.rm(`uploads/${idAnexo}`); // MUITO cuidado com essa linha, ela só é segura aqui pois estamos usando parseInt
  res.sendStatus(204);
}));

router.get('/:id/anexos/:idAnexo', comUnidadeDeTrabalho(), asyncWrapper(async (req, res) => {
  const idAnexo = parseInt(req.params.idAnexo);
  const filename = await consultarNomeDoAnexo(parseInt(req.params.id), idAnexo, req.loginDoUsuario, req.uow);
  await asyncDownload(`uploads/${idAnexo}`, filename, res);
}));

export default router;
