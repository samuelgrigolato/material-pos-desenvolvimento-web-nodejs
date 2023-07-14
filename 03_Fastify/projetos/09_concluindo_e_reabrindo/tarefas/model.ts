import util from 'util';

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

let sequencial: number = 0;
const tarefas: Tarefa[] = [];

export async function cadastrarTarefa(usuario: Usuario | null, dados: DadosTarefa): Promise<IdTarefa> {
  if (usuario === null) {
    throw new UsuarioNaoAutenticado();
  }
  await pausar(100);
  sequencial++;
  const idTarefa = sequencial;
  const tarefa = {
    ...dados,
    id: idTarefa,
    loginDoUsuario: usuario.login,
    dataDaConclusao: null,
  };
  tarefas.push(tarefa);
  console.log('cadastrou', tarefa);
  return idTarefa;
}

export async function consultarTarefas(usuario: Usuario | null, termo?: string): Promise<Tarefa[]> {
  if (usuario === null) {
    throw new UsuarioNaoAutenticado();
  }
  await pausar(100);
  return tarefas
    .filter(x => usuario.admin || x.loginDoUsuario === usuario.login)
    .filter(x => !termo || x.descricao.includes(termo));
}

export async function consultarTarefaPeloId(usuario: Usuario | null, id: IdTarefa): Promise<Tarefa> {
  if (usuario === null) {
    throw new UsuarioNaoAutenticado();
  }
  await pausar(100);
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
  await pausar(100);
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
  console.log('concluiu', tarefa);
}
