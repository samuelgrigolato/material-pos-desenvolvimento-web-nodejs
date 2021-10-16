import knex from '../querybuilder.js';
import { AcessoNegado, DadosOuEstadoInvalido, UsuarioNaoAutenticado } from '../erros.js';
import { cadastrarEtiquetaSeNecessario } from '../etiquetas/model.js';


export async function cadastrarTarefa (tarefa, usuario) {
  if (usuario === undefined) {
    throw new UsuarioNaoAutenticado();
  }
  const loginDoUsuario = usuario.login;

  const res = await knex('tarefas')
    .insert({
      descricao: tarefa.descricao,
      id_categoria: tarefa.id_categoria,
      id_usuario: knex('usuarios').select('id').where('login', loginDoUsuario)
    })
    .returning('id');
  const idTarefa = res[0];

  return idTarefa;
}


export async function vincularEtiqueta (idTarefa, descricaoDaEtiqueta, usuario, trx) {
  await assegurarExistenciaEAcesso(idTarefa, usuario);
  const idEtiqueta = await cadastrarEtiquetaSeNecessario(descricaoDaEtiqueta, trx);
  await trx('tarefa_etiqueta')
    .insert({
      id_tarefa: idTarefa,
      id_etiqueta: idEtiqueta
    })
    .onConflict().ignore();
}


export async function alterarTarefa (idTarefa, patch, usuario) {
  await assegurarExistenciaEAcesso(idTarefa, usuario);
  const values = {};
  if (patch.descricao) values.descricao = patch.descricao;
  if (patch.id_categoria) values.id_categoria = patch.id_categoria;
  if (Object.keys(values).length === 0) return;
  await knex('tarefas')
    .update(values)
    .where('id', idTarefa);
}

export async function consultarTarefas (termo, usuario) {
  if (usuario === undefined) {
    throw new UsuarioNaoAutenticado();
  }

  let query = knex('tarefas')
    .join('usuarios', 'usuarios.id', 'tarefas.id_usuario')
    .where('usuarios.login', usuario.login)
    .select('tarefas.id', 'descricao', 'data_conclusao');
  if (termo !== undefined && termo !== '') {
    query = query.where('descricao', 'ilike', `%${termo}%`);
  }

  const res = await query.orderBy('descricao');

  return res.map(x => ({
    id: x.id,
    descricao: x.descricao,
    concluida: x.data_conclusao !== null
  }));
}

export async function concluirTarefa (idTarefa, usuario) {
  await assegurarExistenciaEAcesso(idTarefa, usuario);
  await knex('tarefas')
    .update({ data_conclusao: new Date() })
    .where('id', idTarefa);
}

export async function reabrirTarefa (idTarefa, usuario) {
  await assegurarExistenciaEAcesso(idTarefa, usuario);
  await knex('tarefas')
    .update({ data_conclusao: null })
    .where('id', idTarefa);
}

export async function excluirTarefa (idTarefa, usuario) {
  await assegurarExistenciaEAcesso(idTarefa, usuario);
  await knex('tarefas')
    .delete()
    .where('id', idTarefa);
}

async function assegurarExistenciaEAcesso (idTarefa, usuario) {
  const res = await knex('tarefas')
    .join('usuarios', 'usuarios.id', 'tarefas.id_usuario')
    .where('tarefas.id', idTarefa)
    .select('usuarios.login');
  if (res.length === 0) {
    throw new DadosOuEstadoInvalido('TarefaNaoEncontrada', 'Tarefa não encontrada.');
  }
  const tarefa = res[0];
  if (tarefa.login !== usuario.login) {
    throw new AcessoNegado();
  }
}
