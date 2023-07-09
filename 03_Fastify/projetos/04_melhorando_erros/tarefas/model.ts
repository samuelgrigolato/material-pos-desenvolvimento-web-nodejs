import util from 'util';

import { UsuarioNaoAutenticado } from '../shared/erros';
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
