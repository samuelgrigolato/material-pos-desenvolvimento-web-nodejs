import util from 'util';

import { AcessoNegado, DadosOuEstadoInvalido, UsuarioNaoAutenticado } from '../erros.js';
import { isAdmin } from '../usuarios/model.js';

const pausar = util.promisify(setTimeout);

let sequencial = 3;
const tarefas = [
  {
    id: 1,
    loginDoUsuario: 'pedro',
    descricao: 'Comprar leite',
    dataDeConclusao: null
  },
  {
    id: 2,
    loginDoUsuario: 'pedro',
    descricao: 'Trocar lâmpada',
    dataDeConclusao: new Date()
  },
  {
    id: 3,
    loginDoUsuario: 'clara',
    descricao: 'Instalar torneira',
    dataDeConclusao: null
  }
];

export async function cadastrarTarefa (tarefa, loginDoUsuario) {
  if (loginDoUsuario === undefined) {
    throw new UsuarioNaoAutenticado();
  }
  await pausar(25);
  sequencial++;
  tarefas.push({
    id: sequencial,
    loginDoUsuario,
    dataDeConclusao: null,
    ...tarefa
  });
  return sequencial;
}

export async function consultarTarefas (termo, loginDoUsuario) {
  if (loginDoUsuario === undefined) {
    throw new UsuarioNaoAutenticado();
  }
  await pausar(25);
  const usuarioIsAdmin = await isAdmin(loginDoUsuario);
  let tarefasDisponiveis = usuarioIsAdmin ? tarefas : tarefas.filter(x => x['loginDoUsuario'] === loginDoUsuario);
  if (termo !== undefined && termo !== '') {
    tarefasDisponiveis = tarefasDisponiveis
      .filter(x => x["descricao"].toLowerCase().indexOf(termo.toLowerCase()) >= 0);
  }
  return tarefasDisponiveis.map(x => ({
    id: x.id,
    descricao: x.descricao,
    concluida: !!x.dataDeConclusao
  }));
}

export async function contarTarefasAbertas (loginDoUsuario) {
  if (loginDoUsuario === undefined) {
    throw new UsuarioNaoAutenticado();
  }
  await pausar(25);
  return tarefas.filter(x => x['loginDoUsuario'] === loginDoUsuario).length;
}

export async function buscarTarefa (id, loginDoUsuario) {
  if (loginDoUsuario === undefined) {
    throw new UsuarioNaoAutenticado();
  }
  await pausar(25);
  const tarefa = tarefas.find(x => x['id'] === parseInt(id));
  if (tarefa === undefined) {
    throw new DadosOuEstadoInvalido('TarefaNaoEncontrada', 'Tarefa não encontrada.');
  }
  if (tarefa['loginDoUsuario'] !== loginDoUsuario) {
    throw new AcessoNegado();
  }
  return {
    descricao: tarefa.descricao,
    concluida: !!tarefa.dataDeConclusao
  };
}

export async function concluirTarefa (id, loginDoUsuario) {
  if (loginDoUsuario === undefined) {
    throw new UsuarioNaoAutenticado();
  }
  await pausar(25);
  const tarefa = tarefas.find(x => x['id'] === parseInt(id));
  if (tarefa === undefined) {
    throw new DadosOuEstadoInvalido('TarefaNaoEncontrada', 'Tarefa não encontrada.');
  }
  if (tarefa['loginDoUsuario'] !== loginDoUsuario) {
    throw new AcessoNegado();
  }
  if (tarefa.dataDeConclusao === null) {
    tarefa.dataDeConclusao = new Date(); // expor um boolean não significa que temos que armazenar um, checkmate scaffolders.
  } // sem else para garantir idempotência
}
