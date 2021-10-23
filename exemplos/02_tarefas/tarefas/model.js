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

const CACHE_CONSULTAR_TAREFAS = {};

export async function consultarTarefas (termo, loginDoUsuario) {
  if (loginDoUsuario === undefined) {
    throw new UsuarioNaoAutenticado();
  }
  if (CACHE_CONSULTAR_TAREFAS[loginDoUsuario] !== undefined) {
    const { validoAte, valor } = CACHE_CONSULTAR_TAREFAS[loginDoUsuario];
    if (validoAte >= new Date().getTime()) {
      return valor;
    } else {
      delete CACHE_CONSULTAR_TAREFAS[loginDoUsuario];
    }
  }
  let query = knex('tarefas')
    .join('usuarios', 'usuarios.id', 'tarefas.id_usuario')
    .andWhere('usuarios.login', loginDoUsuario)
    .select('tarefas.id', 'descricao', 'data_conclusao', 'id_categoria');
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

  const resAnexos = await knex('anexos')
    .select('id_tarefa', 'id', 'nome', 'tamanho', 'mime_type')
    .whereIn('id_tarefa', idsTarefa);
  const mapaAnexos = {};
  for (const vinculo of resAnexos) {
    const idTarefa = vinculo.id_tarefa;
    if (mapaAnexos[idTarefa] === undefined) {
      mapaAnexos[idTarefa] = [];
    }
    mapaAnexos[idTarefa].push({
      id: vinculo.id,
      nome: vinculo.nome,
      tamanho: vinculo.tamanho,
      mime_type: vinculo.mime_type
    });
  }

  const valor = res.map(x => ({
    id: x.id,
    descricao: x.descricao,
    concluida: !!x.data_conclusao,
    etiquetas: mapaEtiquetas[x.id] || [],
    anexos: mapaAnexos[x.id] || [],
    id_categoria: x.id_categoria
  }));
  // a instrução abaixo habilita cache no nível do modelo
  // CACHE_CONSULTAR_TAREFAS[loginDoUsuario] = {
  //   validoAte: new Date().getTime() + 10 * 1000 /* 10 segundos */,
  //   valor
  // };
  return valor;
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
  await knex('anexos')
    .delete()
    .where('id_tarefa', id);
  await knex('tarefa_etiqueta')
    .delete()
    .where('id_tarefa', id);
  await knex('tarefas')
    .delete()
    .where('id', id);
}

export async function vincularEtiqueta (idTarefa, etiqueta, loginDoUsuario, uow) {
  await assegurarExistenciaEAcesso(idTarefa, loginDoUsuario, uow);
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

export async function cadastrarAnexo (idTarefa, nome, tamanho, mimeType, loginDoUsuario, uow) {
  await assegurarExistenciaEAcesso(idTarefa, loginDoUsuario);
  const res = await knex('anexos')
    .transacting(uow)
    .insert({
      id_tarefa: idTarefa,
      nome,
      tamanho,
      mime_type: mimeType
    })
    .returning('id');
  return res[0];
}

export async function excluirAnexo (idTarefa, idAnexo, loginDoUsuario, uow) {
  await assegurarExistenciaEAcesso(idTarefa, loginDoUsuario);
  await assegurarExistenciaEDescendenciaDoAnexo(idTarefa, idAnexo, uow);
  await knex('anexos')
    .transacting(uow)
    .where('id', idAnexo)
    .delete();
}

export async function consultarNomeDoAnexo (idTarefa, idAnexo, loginDoUsuario, uow) {
  await assegurarExistenciaEAcesso(idTarefa, loginDoUsuario);
  await assegurarExistenciaEDescendenciaDoAnexo(idTarefa, idAnexo, uow);
  const res = await knex('anexos')
    .select('nome')
    .where('id', idAnexo);
  return res[0].nome;
}

async function assegurarExistenciaEDescendenciaDoAnexo (idTarefa, idAnexo, uow) {
  const res = await knex('anexos')
    .transacting(uow)
    .select('id_tarefa')
    .where('id', idAnexo);
  if (res.length === 0) {
    throw new DadosOuEstadoInvalido('AnexoNaoEncontrado', 'Anexo não encontrado.');
  }
  const anexo = res[0];
  if (anexo.id_tarefa !== idTarefa) {
    throw new DadosOuEstadoInvalido('AnexoNaoEncontrado', 'Anexo não encontrado.');
  }
}

async function assegurarExistenciaEAcesso (idTarefa, loginDoUsuario, uow) {
  if (loginDoUsuario === undefined) {
    throw new UsuarioNaoAutenticado();
  }
  const trx = uow || knex;
  const res = await trx('tarefas')
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
