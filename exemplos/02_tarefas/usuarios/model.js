import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

import { AutenticacaoInvalida, DadosOuEstadoInvalido, UsuarioNaoAutenticado } from '../erros.js';
import knex from '../querybuilder.js';


export async function autenticar (login, senha) {
  const res = await knex('usuarios')
    .where('login', login)
    .select('id', 'senha');
  if (res.lenght === 0) {
    throw new DadosOuEstadoInvalido('CredenciaisInvalidas', 'Credenciais inválidas.');
  }
  const usuario = res[0];
  if (!bcrypt.compareSync(senha, usuario.senha)) {
    throw new DadosOuEstadoInvalido('CredenciaisInvalidas', 'Credenciais inválidas.');
  }
  const autenticacao = uuidv4();
  await knex('autenticacoes')
    .insert({ id: autenticacao, id_usuario: usuario.id });
  return autenticacao;
}


export async function recuperarLoginDoUsuarioAutenticado (autenticacao) {
  const res = await knex('usuarios')
    .join('autenticacoes', 'autenticacoes.id_usuario', 'usuarios.id')
    .where('autenticacoes.id', autenticacao)
    .select('usuarios.login');
  if (res.length === 0) {
    throw new AutenticacaoInvalida();
  }
  return res[0]['login'];
}


export async function recuperarDadosDoUsuario (login) {
  if (login === undefined) {
    throw new UsuarioNaoAutenticado();
  }

  const res = await knex('usuarios')
    .select('nome')
    .where('login', login);
  if (res.length === 0) {
    throw new Error('Usuário não encontrado.');
  }
  return res[0];
}


export async function alterarNomeDoUsuario (novoNome, login) {
  if (login === undefined) {
    throw new UsuarioNaoAutenticado();
  }
  if (novoNome === undefined || novoNome === '') {
    throw new DadosOuEstadoInvalido('CampoObrigatorio', 'Informe o novo nome.');
  }
  await knex('usuarios')
    .update('nome', novoNome);
}
