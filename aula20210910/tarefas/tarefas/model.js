import util from 'util';

import { AcessoNegado, DadosOuEstadoInvalido, UsuarioNaoAutenticado } from '../erros.js';

const pausar = util.promisify(setTimeout);

let sequencial = 3;
const tarefas = [
  {
    id: 1,
    descricao: 'Comprar leite.',
    loginDoUsuario: 'pedro',
    dataDaConclusao: null
  },
  {
    id: 2,
    descricao: 'Trocar lâmpada.',
    loginDoUsuario: 'pedro',
    dataDaConclusao: '2020-01-02T10:30:01+03:00'
  },
  {
    id: 3,
    descricao: 'Instalar torneira.',
    loginDoUsuario: 'clara',
    dataDaConclusao: null
  }
];

export async function cadastrarTarefa (tarefa, usuario) {
  if (usuario === undefined) {
    throw new UsuarioNaoAutenticado();
  }
  const loginDoUsuario = usuario.login;
  await pausar(25);
  sequencial++;
  tarefas.push({
    id: sequencial,
    loginDoUsuario,
    descricao: tarefa.descricao,
    dataDaConclusao: null
  });
  return sequencial;
}

export async function consultarTarefas (termo, usuario) {
  if (usuario === undefined) {
    throw new UsuarioNaoAutenticado();
  }
  await pausar(25);

  const loginDoUsuario = usuario.login;
  const usuarioAdmin = usuario.admin;

  let resultado = usuarioAdmin ?
    tarefas :
    tarefas.filter(x => x.loginDoUsuario === loginDoUsuario);

  if (termo !== undefined && termo !== null) {
    const termoLowerCase = termo.toLocaleLowerCase();
    resultado = resultado.filter(x => x.descricao.toLocaleLowerCase().includes(termoLowerCase));
  }
  return resultado.map(x => ({
    id: x.id,
    descricao: x.descricao,
    concluida: x.dataDaConclusao !== null
  }));
}

export async function concluirTarefa (idTarefa, usuario) {
  await pausar(25);
  const tarefa = tarefas.find(x => x['id'] === parseInt(idTarefa));
  if (tarefa === undefined) {
    throw new DadosOuEstadoInvalido('TarefaNaoEncontrada', 'Tarefa não encontrada.');
  }
  if (tarefa.loginDoUsuario !== usuario.login) {
    throw new AcessoNegado();
  }
  if (tarefa.dataDaConclusao === null) {
    tarefa.dataDaConclusao = new Date().toISOString();
  }
}

export async function reabrirTarefa (idTarefa, usuario) {
  await pausar(25);
  const tarefa = tarefas.find(x => x['id'] === parseInt(idTarefa));
  if (tarefa === undefined) {
    throw new DadosOuEstadoInvalido('TarefaNaoEncontrada', 'Tarefa não encontrada.');
  }
  if (tarefa.loginDoUsuario !== usuario.login) {
    throw new AcessoNegado();
  }
  tarefa.dataDaConclusao = null;
}
