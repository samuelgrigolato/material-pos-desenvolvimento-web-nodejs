import { v4 as uuidv4 } from 'uuid';
import util from 'util';
import bcrypt from 'bcrypt';

import { AutenticacaoInvalida, DadosOuEstadoInvalido } from '../shared/erros';
import knex from '../shared/querybuilder';

const pausar = util.promisify(setTimeout);

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

export async function autenticar (login: Login, senha: Senha): Promise<IdAutenticacao> {
  const usuario = await knex('usuarios')
    .select('id', 'login', 'senha', 'nome', 'admin')
    .where({ login })
    .first();
  if (usuario === undefined || (await senhaInvalida(senha, usuario.senha))) {
    throw new DadosOuEstadoInvalido('Login ou senha inválidos', {
      codigo: 'CREDENCIAIS_INVALIDAS'
    });
  }
  const id = gerarId();
  await knex('autenticacoes')
    .insert({ id_usuario: usuario.id, id });
  return id;
}

async function senhaInvalida(senha: string, hash: string): Promise<boolean> {
  const hashCompativel = await bcrypt.compare(senha, hash);
  return !hashCompativel;
}

export async function recuperarUsuarioAutenticado (token: IdAutenticacao): Promise<Usuario> {
  const usuario = await knex('autenticacoes')
    .join('usuarios', 'usuarios.id', 'autenticacoes.id_usuario')
    .select<Usuario>('usuarios.id', 'login', 'senha', 'nome', 'admin')
    .where('autenticacoes.id', token)
    .first();
  if (usuario === undefined) {
    throw new AutenticacaoInvalida();
  }
  return usuario;
}

export async function alterarNome (usuario: Usuario, novoNome: string): Promise<void> {
  await pausar(25);
  usuario.nome = novoNome; // isso funciona pois a referência é a mesma!
  // em um cenário real, teríamos uma chamada SQL aqui
}

function gerarId (): IdAutenticacao {
  return uuidv4();
}
