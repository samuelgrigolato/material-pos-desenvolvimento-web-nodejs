import { readFile, writeFile } from 'fs/promises';

import { AcessoNegado, DadosOuEstadoInvalido, UsuarioNaoAutenticado } from '../erros.js';


async function carregarTarefas () {
  const str = await readFile('dados.json', 'utf-8');
  return JSON.parse(str);
}


async function armazenarTarefas (tarefas, sequencial) {
  const dados = { tarefas, sequencial };
  await writeFile(
    'dados.json',
    JSON.stringify(dados, undefined, 2),
    {
      encoding: 'utf-8'
    }
  )
}


export async function cadastrarTarefa (tarefa, usuario) {
  if (usuario === undefined) {
    throw new UsuarioNaoAutenticado();
  }
  const loginDoUsuario = usuario.login;

  let { sequencial, tarefas } = await carregarTarefas();
  sequencial++;
  tarefas.push({
    id: sequencial,
    loginDoUsuario,
    descricao: tarefa.descricao,
    dataDaConclusao: null
  });
  await armazenarTarefas(tarefas, sequencial);

  return sequencial;
}

export async function consultarTarefas (termo, usuario) {
  if (usuario === undefined) {
    throw new UsuarioNaoAutenticado();
  }

  const loginDoUsuario = usuario.login;
  const usuarioAdmin = usuario.admin;

  const { tarefas } = await carregarTarefas();
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
  const { tarefas, sequencial } = await carregarTarefas();
  const tarefa = tarefas.find(x => x['id'] === parseInt(idTarefa));
  if (tarefa === undefined) {
    throw new DadosOuEstadoInvalido('TarefaNaoEncontrada', 'Tarefa não encontrada.');
  }
  if (tarefa.loginDoUsuario !== usuario.login) {
    throw new AcessoNegado();
  }
  if (tarefa.dataDaConclusao === null) {
    tarefa.dataDaConclusao = new Date().toISOString();
    await armazenarTarefas(tarefas, sequencial);
  }
}

export async function reabrirTarefa (idTarefa, usuario) {
  const { tarefas, sequencial } = await carregarTarefas();
  const tarefa = tarefas.find(x => x['id'] === parseInt(idTarefa));
  if (tarefa === undefined) {
    throw new DadosOuEstadoInvalido('TarefaNaoEncontrada', 'Tarefa não encontrada.');
  }
  if (tarefa.loginDoUsuario !== usuario.login) {
    throw new AcessoNegado();
  }
  if (tarefa.dataDaConclusao !== null) {
    tarefa.dataDaConclusao = null;
    await armazenarTarefas(tarefas, sequencial);
  }
}
