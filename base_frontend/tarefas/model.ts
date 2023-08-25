import { Knex } from 'knex';
import { v4 as uuid } from 'uuid';

import { Chatbot, HoraMinuto } from '../chatbot/api';
import { AcessoNegado, DadosOuEstadoInvalido, UsuarioNaoAutenticado } from '../shared/erros';
import { Usuario } from '../usuarios/model';
import {
  cadastrarEtiquetaSeNecessario, buscarIdDaEtiquetaPelaDescricao,
  removerEtiquetaSeObsoleta
} from '../etiquetas/model';

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

type TarefaDetalhada =
  Tarefa
  & { etiquetas: string[] };

interface Anexo {
  id: string;
  nome: string;
  mime_type: string;
  tamanho: number;
  id_tarefa: number;
}

declare module 'knex/types/tables' {
  interface Tables {
    tarefas: Tarefa;
    anexos: Anexo;
  }
}

export async function cadastrarTarefa(
  usuario: Usuario | null, dados: DadosTarefa,
  uow: Knex
): Promise<IdTarefa> {
  if (usuario === null) {
    throw new UsuarioNaoAutenticado();
  }
  const res = await uow('tarefas')
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

export async function consultarTarefas(
  usuario: Usuario | null, termo: string | undefined,
  uow: Knex
): Promise<TarefaDetalhada[]> {
  if (usuario === null) {
    throw new UsuarioNaoAutenticado();
  }
  let query = uow('tarefas')
    .select('id', 'descricao', 'id_categoria',
            'id_usuario', 'data_conclusao', 'descricao'); // sem o await!
  if (!usuario.admin) {
    query = query.where('id_usuario', usuario.id);
  }
  if (termo) {
    query = query.where('descricao', 'ilike', `%${termo}%`);
  }
  const tarefas = await query;

  const idTarefas = tarefas.map(x => x.id);
  const tarefaEtiquetas = await uow('tarefa_etiqueta')
    .join('etiquetas', 'etiquetas.id', 'tarefa_etiqueta.id_etiqueta')
    .select<{ id_tarefa: number, descricao: string }[]>('id_tarefa', 'descricao')
    .whereIn('id_tarefa', idTarefas);

  const anexos = await uow('anexos')
    .select('id', 'nome', 'tamanho', 'mime_type', 'id_tarefa')
    .whereIn('id_tarefa', idTarefas);

  return tarefas.map(x => ({
    ...x,
    etiquetas: tarefaEtiquetas
      .filter(y => y.id_tarefa === x.id)
      .map(y => y.descricao),
    anexos: anexos
      .filter(y => y.id_tarefa === x.id)
      .map(y => ({ ...y, id_tarefa: undefined }))
  }));
}

export async function consultarTarefaPeloId(
  usuario: Usuario | null, id: IdTarefa, uow: Knex
): Promise<TarefaDetalhada> {
  if (usuario === null) {
    throw new UsuarioNaoAutenticado();
  }
  const res = await uow('tarefas')
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
  const registrosDeEtiqueta = await uow('tarefa_etiqueta')
    .join('etiquetas', 'etiquetas.id', 'tarefa_etiqueta.id_etiqueta')
    .select<string[]>('descricao')
    .where('id_tarefa', id);
  return {
    ...tarefa,
    etiquetas: registrosDeEtiqueta.map(x => x.descricao)
  };
}

async function asseguraExistenciaDaTarefaEAcessoDeEdicao(
  usuario: Usuario, id: IdTarefa, uow: Knex
): Promise<void> {
  const res = await uow('tarefas')
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

export async function alterarTarefa(
  usuario: Usuario | null, id: IdTarefa,
  alteracoes: Partial<DadosTarefa>, uow: Knex
): Promise<void> {
  if (usuario === null) {
    throw new UsuarioNaoAutenticado();
  }
  await asseguraExistenciaDaTarefaEAcessoDeEdicao(usuario, id, uow);
  if (Object.keys(alteracoes).length > 0) {
    await uow('tarefas')
      .update({
        descricao: alteracoes.descricao,
        id_categoria: alteracoes.id_categoria,
      })
      .where('id', id);
  }
}

export async function concluirTarefa(
  usuario: Usuario | null, id: IdTarefa, uow: Knex
): Promise<void> {
  if (usuario === null) {
    throw new UsuarioNaoAutenticado();
  }
  await asseguraExistenciaDaTarefaEAcessoDeEdicao(usuario, id, uow);
  await uow('tarefas')
    .update('data_conclusao', new Date())
    .where('id', id);
}

export async function reabrirTarefa(
  usuario: Usuario | null, id: IdTarefa, uow: Knex
): Promise<void> {
  if (usuario === null) {
    throw new UsuarioNaoAutenticado();
  }
  await asseguraExistenciaDaTarefaEAcessoDeEdicao(usuario, id, uow);
  await uow('tarefas')
    .update('data_conclusao', null)
    .where('id', id);
}

export async function excluirTarefa(
  usuario: Usuario | null, id: IdTarefa, uow: Knex
): Promise<void> {
  if (usuario === null) {
    throw new UsuarioNaoAutenticado();
  }
  await asseguraExistenciaDaTarefaEAcessoDeEdicao(usuario, id, uow);
  await uow('tarefa_etiqueta')
    .delete()
    .where('id_tarefa', id);
  await uow('tarefas')
    .delete()
    .where('id', id);
}

export async function vincularEtiquetaNaTarefa(
  usuario: Usuario | null, id: IdTarefa,
  etiqueta: string, uow: Knex
): Promise<void> {
  if (usuario === null) {
    throw new UsuarioNaoAutenticado();
  }
  await asseguraExistenciaDaTarefaEAcessoDeEdicao(usuario, id, uow);
  const idEtiqueta = await cadastrarEtiquetaSeNecessario(etiqueta, uow);
  await uow('tarefa_etiqueta')
    .insert({
      id_tarefa: id,
      id_etiqueta: idEtiqueta,
    })
    .onConflict(['id_tarefa', 'id_etiqueta']).ignore();
}

export async function desvincularEtiquetaDaTarefa(
  usuario: Usuario | null, id: IdTarefa,
  etiqueta: string, uow: Knex
): Promise<void> {
  if (usuario === null) {
    throw new UsuarioNaoAutenticado();
  }
  await asseguraExistenciaDaTarefaEAcessoDeEdicao(usuario, id, uow);
  const idEtiqueta = await buscarIdDaEtiquetaPelaDescricao(etiqueta, uow);
  await uow('tarefa_etiqueta')
    .delete()
    .where({
      id_tarefa: id,
      id_etiqueta: idEtiqueta,
    });
  await removerEtiquetaSeObsoleta(idEtiqueta, uow);
}

export async function planejarTarefasDoProjeto(descricao: string, chatbot: Chatbot): Promise<string[]> {
  return await chatbot.perguntarListaDeFrases({
    contexto: `Tafeito é um sistema de gestão de tarefas (TODO) individual.
      Você é um gerador de tarefas para o Tafeito. Uma tarefa do Tafeito é uma
      simples frase com no máximo 150 caracteres. Entenda a frase do usuário como
      o projeto/objetivo que ele deseja atingir e escreva 1 ou mais tarefas para
      o Tafeito.`,
    entrada: descricao,
  });
}

export async function sugerirProximaTarefa(usuario: Usuario, uow: Knex, chatbot: Chatbot): Promise<string> {
  const historico = await uow('tarefas')
    .select('descricao')
    .where('id_usuario', usuario.id)
    .orderBy('id', 'desc')
    .limit(10);
  return await chatbot.perguntarFraseUnica({
    contexto: `Tafeito é um sistema de gestão de tarefas (TODO) individual.
      Você é um gerador de tarefas para o Tafeito. Uma tarefa do Tafeito é uma
      simples frase com no máximo 150 caracteres. Você vai sugerir a tarefa que 
      faria mais sentido ser a próxima para este usuário, baseando-se nas seguintes
      tarefas presentes no seu histórico:

      ${historico.map(x => x.descricao).join('\n')}`,
  });
}

export async function estimarTextual(usuario: Usuario, idTarefa: number, uow: Knex, chatbot: Chatbot): Promise<string> {
  const res = await uow('tarefas')
    .select('id_usuario', 'descricao')
    .where('id', idTarefa)
    .first();
  if (res === undefined) {
    throw new DadosOuEstadoInvalido('Tarefa não encontrada', {
      codigo: 'TAREFA_NAO_ENCONTRADA'
    });
  }
  if (!usuario.admin && usuario.id !== res.id_usuario) {
    throw new AcessoNegado();
  }
  return await chatbot.perguntarFraseUnica({
    contexto: `Tafeito é um sistema de gestão de tarefas (TODO) individual. Você é um
      estimador de tempo de execução das tarefas do usuário do Tafeito. Sua resposta
      deve ser uma frase simples e única com a quantidade estimada em horas e minutos.
      Você deve estimar quanto tempo o usuário provavelmente vai demorar para
      executar a seguinte tarefa: ${res.descricao}`,
  });
}

export async function estimar(usuario: Usuario, idTarefa: number, uow: Knex, chatbot: Chatbot): Promise<HoraMinuto> {
  const res = await uow('tarefas')
    .select('id_usuario', 'descricao')
    .where('id', idTarefa)
    .first();
  if (res === undefined) {
    throw new DadosOuEstadoInvalido('Tarefa não encontrada', {
      codigo: 'TAREFA_NAO_ENCONTRADA'
    });
  }
  if (!usuario.admin && usuario.id !== res.id_usuario) {
    throw new AcessoNegado();
  }
  return await chatbot.perguntarDuracaoDeTempo({
    contexto: `Responda a quantidade aproximada de minutos que alguém levaria para executar a seguinte tarefa: ${res.descricao}`
  });
}

export async function cadastrarAnexo(usuario: Usuario, idTarefa: number, nome: string, tamanho: number, mimeType: string, uow: Knex): Promise<string> {
  await asseguraExistenciaDaTarefaEAcessoDeEdicao(usuario, idTarefa, uow);
  const id = uuid();
  await uow('anexos')
    .insert({
      id,
      id_tarefa: idTarefa,
      nome,
      tamanho,
      mime_type: mimeType,
    });
  return id;
}

export async function excluirAnexo(usuario: Usuario, idTarefa: number, idAnexo: string, uow: Knex): Promise<void> {
  await asseguraExistenciaDaTarefaEAcessoDeEdicao(usuario, idTarefa, uow);
  const res = await uow('anexos')
    .select('id_tarefa')
    .where('id', idAnexo)
    .first();
  if (res === undefined || res.id_tarefa !== idTarefa) {
    throw new DadosOuEstadoInvalido('Anexo não encontrado', {
      codigo: 'ANEXO_NAO_ENCONTRADO'
    });
  }
  await uow('anexos')
    .delete()
    .where('id', idAnexo);
}

export async function consultarAnexoPeloId(usuario: Usuario, idTarefa: number, idAnexo: string, uow: Knex): Promise<Anexo> {
  await asseguraExistenciaDaTarefaEAcessoDeEdicao(usuario, idTarefa, uow);
  const res = await uow('anexos')
    .select('id', 'id_tarefa', 'nome', 'tamanho', 'mime_type')
    .where('id', idAnexo)
    .first();
  if (res === undefined || res.id_tarefa !== idTarefa) {
    throw new DadosOuEstadoInvalido('Anexo não encontrado', {
      codigo: 'ANEXO_NAO_ENCONTRADO'
    });
  }
  return res;
}
