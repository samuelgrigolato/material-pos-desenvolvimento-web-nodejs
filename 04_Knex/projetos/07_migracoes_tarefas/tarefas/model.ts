import knex from '../shared/querybuilder';

import { AcessoNegado, DadosOuEstadoInvalido, UsuarioNaoAutenticado } from '../shared/erros';
import { Usuario } from '../usuarios/model';

export interface DadosTarefa {
  descricao: string;
  id_categoria: number;
}

type IdTarefa = number;

type Tarefa =
  DadosTarefa
  & {
    id: IdTarefa,
    id_usuario: number,
    data_conclusao: Date | null,
  };

declare module 'knex/types/tables' {
  interface Tables {
    tarefas: Tarefa;
  }
}

export async function cadastrarTarefa(usuario: Usuario | null, dados: DadosTarefa): Promise<IdTarefa> {
  if (usuario === null) {
    throw new UsuarioNaoAutenticado();
  }
  const res = await knex('tarefas')
    .insert({
      ...dados,
      id_usuario: usuario.id,
    })
    .returning<Pick<Tarefa, 'id'>[]>('id');
  if (res.length === 0) {
    throw new Error('Erro ao cadastrar a tarefa. res === undefined');
  }
  return res[0].id;
}

export async function consultarTarefas(usuario: Usuario | null, termo?: string): Promise<Tarefa[]> {
  if (usuario === null) {
    throw new UsuarioNaoAutenticado();
  }
  let query = knex('tarefas')
    .select('id', 'descricao', 'id_categoria',
            'id_usuario', 'data_conclusao', 'descricao'); // sem o await!
  if (!usuario.admin) {
    query = query.where('id_usuario', usuario.id);
  }
  if (termo) {
    query = query.where('descricao', 'ilike', `%${termo}%`);
  }
  return await query;
}

export async function consultarTarefaPeloId(usuario: Usuario | null, id: IdTarefa): Promise<Tarefa> {
  if (usuario === null) {
    throw new UsuarioNaoAutenticado();
  }
  const res = await knex('tarefas')
    .select('id', 'descricao', 'id_categoria',
            'id_usuario', 'data_conclusao', 'descricao')
    .where('id', id);
  const tarefa = res[0];
  if (tarefa === undefined) {
    throw new DadosOuEstadoInvalido('Tarefa não encontrada', {
      codigo: 'TAREFA_NAO_ENCONTRADA'
    });
  }
  if (!usuario.admin && usuario.id !== res[0].id_usuario) {
     throw new AcessoNegado();
  }
  return tarefa;
}

async function asseguraExistenciaDaTarefaEAcessoDeEdicao(usuario: Usuario, id: IdTarefa): Promise<void> {
  const res = await knex('tarefas')
    .select('id_usuario')
    .where('id', id)
    .first();
  if (res === undefined) {
    throw new DadosOuEstadoInvalido('Tarefa não encontrada', {
      codigo: 'TAREFA_NAO_ENCONTRADA'
    });
  }
  if (!usuario.admin && usuario.id !== res.id_usuario) {
    throw new AcessoNegado();
  }
}

export async function alterarTarefa(usuario: Usuario | null, id: IdTarefa, alteracoes: Partial<DadosTarefa>): Promise<void> {
  if (usuario === null) {
    throw new UsuarioNaoAutenticado();
  }
  await asseguraExistenciaDaTarefaEAcessoDeEdicao(usuario, id);
  if (Object.keys(alteracoes).length > 0) {
    await knex('tarefas')
      .update({
        descricao: alteracoes.descricao,
        id_categoria: alteracoes.id_categoria,
      })
      .where('id', id);
  }
}

export async function concluirTarefa(usuario: Usuario | null, id: IdTarefa): Promise<void> {
  if (usuario === null) {
    throw new UsuarioNaoAutenticado();
  }
  await asseguraExistenciaDaTarefaEAcessoDeEdicao(usuario, id);
  await knex('tarefas')
    .update('data_conclusao', new Date())
    .where('id', id);
}

export async function reabrirTarefa(usuario: Usuario | null, id: IdTarefa): Promise<void> {
  if (usuario === null) {
    throw new UsuarioNaoAutenticado();
  }
  await asseguraExistenciaDaTarefaEAcessoDeEdicao(usuario, id);
  await knex('tarefas')
    .update('data_conclusao', null)
    .where('id', id);
}

export async function excluirTarefa(usuario: Usuario | null, id: IdTarefa): Promise<void> {
  if (usuario === null) {
    throw new UsuarioNaoAutenticado();
  }
  await asseguraExistenciaDaTarefaEAcessoDeEdicao(usuario, id);
  await knex('tarefas')
    .delete()
    .where('id', id);
}
