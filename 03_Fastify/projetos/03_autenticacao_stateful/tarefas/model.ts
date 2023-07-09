import util from 'util';

import { Login } from '../usuarios/model';

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
  };

let sequencial: number = 0;
const tarefas: Tarefa[] = [];

export async function cadastrarTarefa(loginDoUsuario: Login | null, dados: DadosTarefa): Promise<IdTarefa> {
  if (loginDoUsuario === null) {
    throw new Error('Usuário não autenticado');
  }
  await pausar(100);
  sequencial++;
  const idTarefa = sequencial;
  const tarefa = {
    ...dados,
    id: idTarefa,
    loginDoUsuario,
  };
  tarefas.push(tarefa);
  console.log('cadastrou', tarefa);
  return idTarefa;
}

export async function consultarTarefas(loginDoUsuario: Login | null, termo?: string): Promise<Tarefa[]> {
  if (loginDoUsuario === null) {
    throw new Error('Usuário não autenticado');
  }
  await pausar(100);
  return tarefas
    .filter(x => x.loginDoUsuario === loginDoUsuario)
    .filter(x => !termo || x.descricao.includes(termo));
}
