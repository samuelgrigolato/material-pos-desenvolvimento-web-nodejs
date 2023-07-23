import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';
import { Knex } from 'knex';

import { AutenticacaoInvalida, DadosOuEstadoInvalido } from '../shared/erros';

type UUIDString = string;
type IdAutenticacao = UUIDString;
type Senha = string;
export type Login = string;

export type Usuario = {
  id: number;
  nome: string;
  login: Login;
  senha: Senha;
  admin: boolean; // poderia ser também um enum, por exemplo: tipo: 'admin' | 'usuario'
}

type Autenticacao = {
  id_usuario: number;
  id: IdAutenticacao;
}

declare module 'knex/types/tables' {
  interface Tables {
    usuarios: Usuario;
    autenticacoes: Autenticacao;
  }
}

export async function autenticar (login: Login, senha: Senha, uow: Knex): Promise<IdAutenticacao> {
  const usuario = await uow('usuarios')
    .select('id', 'login', 'senha', 'nome', 'admin')
    .where({ login })
    .first();
  if (usuario === undefined || (await senhaInvalida(senha, usuario.senha))) {
    throw new DadosOuEstadoInvalido('Login ou senha inválidos', {
      codigo: 'CREDENCIAIS_INVALIDAS'
    });
  }
  const id = gerarId();
  await uow('autenticacoes')
    .insert({ id_usuario: usuario.id, id });
  return id;
}

async function senhaInvalida(senha: string, hash: string): Promise<boolean> {
  const hashCompativel = await bcrypt.compare(senha, hash);
  return !hashCompativel;
}

export async function recuperarUsuarioAutenticado (token: IdAutenticacao, uow: Knex): Promise<Usuario> {
  const usuario = await uow('autenticacoes')
    .join('usuarios', 'usuarios.id', 'autenticacoes.id_usuario')
    .select<Usuario>('usuarios.id', 'login', 'senha', 'nome', 'admin')
    .where('autenticacoes.id', token)
    .first();
  if (usuario === undefined) {
    throw new AutenticacaoInvalida();
  }
  return usuario;
}

export async function alterarNome (usuario: Usuario, novoNome: string, uow: Knex): Promise<void> {
  await uow('usuarios')
    .update({ nome: novoNome })
    .where({ id: usuario.id });
}

function gerarId (): IdAutenticacao {
  return uuidv4();
}
