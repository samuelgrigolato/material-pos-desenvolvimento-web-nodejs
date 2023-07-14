import util from 'util';
import { readFile, writeFile } from 'fs/promises';

import { AcessoNegado, DadosOuEstadoInvalido, UsuarioNaoAutenticado } from '../shared/erros';
import { Usuario, Login } from '../usuarios/model';

const pausar = util.promisify(setTimeout);

export interface DadosTarefa {
  descricao: string;
}

type IdTarefa = number;

type Tarefa =
  DadosTarefa
  & {
    id: IdTarefa,
    loginDoUsuario: Login,
    dataDaConclusao: Date | null,
  };

type Dados = {
  sequencial: number,
  tarefas: Tarefa[],
};

async function carregarTarefas(): Promise<Dados> {
  const dados = await readFile('dados.json', 'utf-8');
  return JSON.parse(dados);
}

async function armazenarTarefas(dados: Dados): Promise<void> {
  await writeFile('dados.json', JSON.stringify(dados, undefined, 2), 'utf-8');
}

export async function cadastrarTarefa(usuario: Usuario | null, dados: DadosTarefa): Promise<IdTarefa> {
  if (usuario === null) {
    throw new UsuarioNaoAutenticado();
  }
  let { tarefas, sequencial } = await carregarTarefas();
  sequencial++;
  const idTarefa = sequencial;
  const tarefa = {
    ...dados,
    id: idTarefa,
    loginDoUsuario: usuario.login,
    dataDaConclusao: null,
  };
  tarefas.push(tarefa);
  await armazenarTarefas({ tarefas, sequencial });
  console.log('cadastrou', tarefa);
  return idTarefa;
}

export async function consultarTarefas(usuario: Usuario | null, termo?: string): Promise<Tarefa[]> {
  if (usuario === null) {
    throw new UsuarioNaoAutenticado();
  }
  const { tarefas } = await carregarTarefas();
  return tarefas
    .filter(x => usuario.admin || x.loginDoUsuario === usuario.login)
    .filter(x => !termo || x.descricao.includes(termo));
}

export async function consultarTarefaPeloId(usuario: Usuario | null, id: IdTarefa): Promise<Tarefa> {
  if (usuario === null) {
    throw new UsuarioNaoAutenticado();
  }
  const { tarefas } = await carregarTarefas();
  const tarefa = tarefas.find(x => x.id === id);
  if (tarefa === undefined) {
    throw new DadosOuEstadoInvalido('Tarefa não encontrada', {
      codigo: 'TAREFA_NAO_ENCONTRADA'
    }); // isso aqui deveria ser um 404?
  }
  if (tarefa.loginDoUsuario !== usuario.login) {
    throw new AcessoNegado();
  }
  return tarefa;
}

export async function concluirTarefa(usuario: Usuario | null, id: IdTarefa): Promise<void> {
  if (usuario === null) {
    throw new UsuarioNaoAutenticado();
  }
  const { tarefas, sequencial } = await carregarTarefas();
  const tarefa = tarefas.find(x => x.id === id);
  if (tarefa === undefined) {
    throw new DadosOuEstadoInvalido('Tarefa não encontrada', {
      codigo: 'TAREFA_NAO_ENCONTRADA'
    });
  }
  if (tarefa.loginDoUsuario !== usuario.login) {
    throw new AcessoNegado();
  }
  tarefa.dataDaConclusao = new Date();
  await armazenarTarefas({ tarefas, sequencial });
  console.log('concluiu', tarefa);
}

export async function reabrirTarefa(usuario: Usuario | null, id: IdTarefa): Promise<void> {
  if (usuario === null) {
    throw new UsuarioNaoAutenticado();
  }
  const { tarefas, sequencial } = await carregarTarefas();
  const tarefa = tarefas.find(x => x.id === id);
  if (tarefa === undefined) {
    throw new DadosOuEstadoInvalido('Tarefa não encontrada', {
      codigo: 'TAREFA_NAO_ENCONTRADA'
    });
  }
  if (tarefa.loginDoUsuario !== usuario.login) {
    throw new AcessoNegado();
  }
  tarefa.dataDaConclusao = null;
  await armazenarTarefas({ tarefas, sequencial });
  console.log('reabriu', tarefa);
}
