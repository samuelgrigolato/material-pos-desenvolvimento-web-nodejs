import bcrypt from 'bcrypt';
import { Knex } from 'knex';
import jwt from 'jsonwebtoken';

import { AutenticacaoInvalida, DadosOuEstadoInvalido, UsuarioNaoAutenticado } from '../shared/erros';

type TokenJWT = string;
type TokenAutenticacao = TokenJWT;
type Senha = string;
export type Login = string;

export type Usuario = {
  id: number;
  nome: string;
  login: Login;
  senha: Senha;
  admin: boolean; // poderia ser também um enum, por exemplo: tipo: 'admin' | 'usuario'
}

declare module 'knex/types/tables' {
  interface Tables {
    usuarios: Usuario;
  }
}

const JWT_SECRET = (() => {
  const env = process.env.JWT_SECRET;
  if (env === undefined || env === '') {
    throw new Error('Env JWT_SECRET não definida.');
  }
  return env;
})();

export async function autenticar (login: Login, senha: Senha, uow: Knex): Promise<TokenAutenticacao> {
  const usuario = await uow('usuarios')
    .select('senha')
    .where({ login })
    .first();
  if (usuario === undefined || (await senhaInvalida(senha, usuario.senha))) {
    throw new DadosOuEstadoInvalido('Login ou senha inválidos', {
      codigo: 'CREDENCIAIS_INVALIDAS'
    });
  }
  return jwt.sign({
    login,
    exp: Math.floor(new Date().getTime() / 1000) + 10 * 24 * 60 * 60 /* 10 dias */
  }, JWT_SECRET);
}

async function senhaInvalida(senha: string, hash: string): Promise<boolean> {
  const hashCompativel = await bcrypt.compare(senha, hash);
  return !hashCompativel;
}

export async function recuperarUsuarioAutenticado (token: TokenJWT, uow: Knex): Promise<Usuario> {
  let login: string;
  try {
    const payload = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload;
    login = payload.login;
  } catch (e: any) {
    if (!['jwt expired', 'invalid signature'].includes(e.message)) {
      console.warn(e);
    }
    throw new AutenticacaoInvalida();
  }
  const usuario = await uow('usuarios')
    .select<Usuario>('id', 'login', 'senha', 'nome', 'admin')
    .where('login', login)
    .first();
  if (usuario === undefined) {
    throw new AutenticacaoInvalida();
  }
  return usuario;
}

export async function alterarNome (usuario: Usuario | null, novoNome: string, uow: Knex): Promise<void> {
  if (usuario === null) {
    throw new UsuarioNaoAutenticado();
  }
  await uow('usuarios')
    .update({ nome: novoNome })
    .where({ id: usuario.id });
}
