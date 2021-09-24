import { AcessoNegado, DadosOuEstadoInvalido, UsuarioNaoAutenticado } from '../erros.js';
import knex from '../querybuilder.js';
import { buscarIdEtiquetaPelaDescricao, cadastrarEtiquetaSeNecessario, removerEtiquetaSeObsoleta } from '../etiquetas/model.js';

export async function cadastrarTarefa (tarefa, loginDoUsuario) {
  if (loginDoUsuario === undefined) {
    throw new UsuarioNaoAutenticado();
  }
  const res = await knex('tarefas')
    .insert({
      descricao: tarefa.descricao,
      id_categoria: tarefa.id_categoria,
      id_usuario: knex('usuarios').select('id').where('login', loginDoUsuario)
    })
    .returning('id');
  return res[0];
}

export async function consultarTarefas (termo, loginDoUsuario) {
  if (loginDoUsuario === undefined) {
    throw new UsuarioNaoAutenticado();
  }
  let query = knex('tarefas')
    .join('usuarios', 'usuarios.id', 'tarefas.id_usuario')
    .andWhere('usuarios.login', loginDoUsuario)
    .select('tarefas.id', 'descricao', 'data_conclusao');
  if (termo !== undefined && termo !== '') {
    query = query.where('descricao', 'ilike', `%${termo}%`);
  }
  const res = await query;

  const idsTarefa = res.map(x => x.id);
  const resEtiquetas = await knex('tarefa_etiqueta')
    .join('etiquetas', 'etiquetas.id', 'tarefa_etiqueta.id_etiqueta')
    .select('id_tarefa', 'etiquetas.descricao', 'etiquetas.cor')
    .whereIn('tarefa_etiqueta.id_tarefa', idsTarefa);
  const mapaEtiquetas = {};
  for (const vinculo of resEtiquetas) {
    const idTarefa = vinculo.id_tarefa;
    if (mapaEtiquetas[idTarefa] === undefined) {
      mapaEtiquetas[idTarefa] = [];
    }
    mapaEtiquetas[idTarefa].push({
      etiqueta: vinculo.descricao,
      cor: vinculo.cor
    });
  }

  return res.map(x => ({
    id: x.id,
    descricao: x.descricao,
    concluida: !!x.data_conclusao,
    etiquetas: mapaEtiquetas[x.id] || []
  }));
}

export async function contarTarefasAbertas (loginDoUsuario) {
  if (loginDoUsuario === undefined) {
    throw new UsuarioNaoAutenticado();
  }
  const res = await knex('tarefas')
    .join('usuarios', 'usuarios.id', 'tarefas.id_usuario')
    .where('login', loginDoUsuario)
    .whereNull('data_conclusao')
    .count('tarefas.id');
  return parseInt(res[0].count);
}

export async function buscarTarefa (id, loginDoUsuario) {
  if (loginDoUsuario === undefined) {
    throw new UsuarioNaoAutenticado();
  }
  const res = await knex('tarefas')
    .join('usuarios', 'usuarios.id', 'tarefas.id_usuario')
    .where('tarefas.id', id)
    .select('usuarios.login', 'tarefas.descricao', 'tarefas.data_conclusao');
  if (res.length === 0) {
    throw new DadosOuEstadoInvalido('TarefaNaoEncontrada', 'Tarefa não encontrada.');
  }
  const tarefa = res[0];
  if (tarefa.login !== loginDoUsuario) {
    throw new AcessoNegado();
  }
  return {
    descricao: tarefa.descricao,
    concluida: !!tarefa.data_conclusao
  };
}

export async function concluirTarefa (id, loginDoUsuario) {
  await assegurarExistenciaEAcesso(id, loginDoUsuario);
  await knex('tarefas')
    .update({ data_conclusao: new Date() })
    .where('id', id);
}

export async function reabrirTarefa (id, loginDoUsuario) {
  await assegurarExistenciaEAcesso(id, loginDoUsuario);
  await knex('tarefas')
    .update({ data_conclusao: null })
    .where('id', id);
}

export async function alterarTarefa (id, patch, loginDoUsuario) {
  await assegurarExistenciaEAcesso(id, loginDoUsuario);
  const values = {};
  if (patch.descricao) values.descricao = patch.descricao;
  if (patch.id_categoria) values.id_categoria = patch.id_categoria;
  if (Object.keys(values).length === 0) return;
  await knex('tarefas')
    .update(values)
    .where('id', id);
}

export async function deletarTarefa (id, loginDoUsuario) {
  await assegurarExistenciaEAcesso(id, loginDoUsuario);
  await knex('tarefa_etiqueta')
    .delete()
    .where('id_tarefa', id);
  await knex('tarefas')
    .delete()
    .where('id', id);
}

export async function vincularEtiqueta (idTarefa, etiqueta, loginDoUsuario, uow) {
  await assegurarExistenciaEAcesso(idTarefa, loginDoUsuario);
  const idEtiqueta = await cadastrarEtiquetaSeNecessario(etiqueta, uow);
  await knex('tarefa_etiqueta')
    .transacting(uow)
    .insert({
      id_tarefa: idTarefa,
      id_etiqueta: idEtiqueta
    })
    .onConflict().ignore();
}

export async function desvincularEtiqueta (idTarefa, etiqueta, loginDoUsuario, uow) {
  await assegurarExistenciaEAcesso(idTarefa, loginDoUsuario);
  const idEtiqueta = await buscarIdEtiquetaPelaDescricao (etiqueta, uow);
  await knex('tarefa_etiqueta')
    .transacting(uow)
    .delete()
    .where({
      id_tarefa: idTarefa,
      id_etiqueta: idEtiqueta
    });
  await removerEtiquetaSeObsoleta(idEtiqueta, uow);
}

async function assegurarExistenciaEAcesso (idTarefa, loginDoUsuario) {
  if (loginDoUsuario === undefined) {
    throw new UsuarioNaoAutenticado();
  }
  const res = await knex('tarefas')
    .join('usuarios', 'usuarios.id', 'tarefas.id_usuario')
    .where('tarefas.id', idTarefa)
    .select('usuarios.login');
  if (res.length === 0) {
    throw new DadosOuEstadoInvalido('TarefaNaoEncontrada', 'Tarefa não encontrada.');
  }
  const tarefa = res[0];
  if (tarefa.login !== loginDoUsuario) {
    throw new AcessoNegado();
  }
}
