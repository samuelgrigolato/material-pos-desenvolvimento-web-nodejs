import { v4 as uuidv4 } from 'uuid';
import util from 'util';

import { AutenticacaoInvalida, DadosOuEstadoInvalido, UsuarioNaoAutenticado } from '../erros.js';

const pausar = util.promisify(setTimeout);

const usuarios = {
  pedro: {
    nome: 'Pedro',
    senha: '123456',
    admin: false
  },
  clara: {
    nome: 'Clara',
    senha: '234567',
    admin: true
  }
};

const autenticacoes = {
  'cb7ffa96-bcbf-41f3-beb5-9ea56d4bc79c': 'pedro',
  '1bcb2f40-079c-4efc-996b-06eeef220b51': 'clara'
};

export async function autenticar (login, senha) {
  await pausar(25);
  const usuario = usuarios[login];
  if (usuario === undefined || usuario.senha !== senha) {
    throw new DadosOuEstadoInvalido('CredenciaisInvalidas', 'Credenciais inválidas.');
  }
  const autenticacao = uuidv4();
  autenticacoes[autenticacao] = login;
  return autenticacao;
};


export async function recuperarLoginDoUsuarioAutenticado (autenticacao) {
  await pausar(25);
  const login = autenticacoes[autenticacao];
  if (login === undefined) {
    throw new AutenticacaoInvalida();
  }
  return login;
}


export async function isAdmin (login) {
  await pausar(25);
  const usuario = usuarios[login];
  if (usuario === undefined) {
    throw new Error('Usuário não encontrado.');
  }
  return usuario.admin;
}


export async function recuperarDadosDoUsuario (login) {
  if (login === undefined) {
    throw new UsuarioNaoAutenticado();
  }
  await pausar(25);
  const usuario = usuarios[login];
  if (usuario === undefined) {
    throw new Error('Usuário não encontrado.');
  }
  return {
    nome: usuario.nome
  };
}


export async function alterarNomeDoUsuario (novoNome, login) {
  if (login === undefined) {
    throw new UsuarioNaoAutenticado();
  }
  if (novoNome === undefined || novoNome === '') {
    throw new DadosOuEstadoInvalido('CampoObrigatorio', 'Informe o novo nome.');
  }
  await pausar(25);
  const usuario = usuarios[login];
  if (usuario === undefined) {
    throw new Error('Usuário não encontrado.');
  }
  usuario['nome'] = novoNome;
}
