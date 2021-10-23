import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

import { AutenticacaoInvalida, DadosOuEstadoInvalido, UsuarioNaoAutenticado } from '../erros.js';
import knex from '../querybuilder.js';


const JWT_SECRET = process.env.JWT_SECRET;
if (JWT_SECRET === undefined || JWT_SECRET === '') {
  throw new Error('Env JWT_SECRET não definida.');
}


export function gerarToken (login) {
  return jwt.sign({
    login,
    exp: Math.floor(new Date().getTime() / 1000) + 10 * 60 * 60 /* 10 horas */
  }, JWT_SECRET);
}


export async function autenticar (login, senha) {
  const res = await knex('usuarios')
    .where('login', login)
    .select('id', 'senha');
  if (res.length === 0) {
    throw new DadosOuEstadoInvalido('CredenciaisInvalidas', 'Credenciais inválidas.');
  }
  const usuario = res[0];
  if (!bcrypt.compareSync(senha, usuario.senha)) {
    throw new DadosOuEstadoInvalido('CredenciaisInvalidas', 'Credenciais inválidas.');
  }
  return gerarToken(login);
}


export async function recuperarLoginDoUsuarioAutenticado (autenticacao) {
  let tokenVerificado;
  try {
    tokenVerificado = jwt.verify(autenticacao, JWT_SECRET);
  } catch (err) {
    if (err.message !== 'invalid signature' && err.message !== 'jwt expired') {
      console.warn(err);
    }
    throw new AutenticacaoInvalida();
  }
  return tokenVerificado['login'];
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
    .update('nome', novoNome)
    .where('login', login);
}
