import { v4 as uuidv4 } from 'uuid';
import util from 'util';

import { AutenticacaoInvalida, DadosOuEstadoInvalido } from '../shared/erros';

const pausar = util.promisify(setTimeout);

type UUIDString = string;
type IdAutenticacao = UUIDString;
type Senha = string;
export type Login = string;

export type Usuario = {
  login: Login;
  senha: Senha;
  admin: boolean; // poderia ser também um enum, por exemplo: tipo: 'admin' | 'usuario'
}

const usuarios: Usuario[] = [
  {
    login: 'pedro',
    senha: '123456',
    admin: false,
  },
  {
    login: 'clara',
    senha: '234567',
    admin: true,
  },
];

const autenticacoes: { [key: IdAutenticacao]: Usuario } = {};

export async function autenticar (login: Login, senha: Senha): Promise<IdAutenticacao> {
  await pausar(25);
  const usuario = usuarios.find(usuario => usuario.login === login);
  if (usuario === undefined || usuario.senha !== senha) {
    throw new DadosOuEstadoInvalido('Login ou senha inválidos', {
      codigo: 'CREDENCIAIS_INVALIDAS'
    });
  }
  const id = gerarId();
  autenticacoes[id] = usuario;
  return id;
}

export async function recuperarUsuarioAutenticado (token: IdAutenticacao): Promise<Usuario> {
  await pausar(25);
  const usuario = autenticacoes[token];
  if (usuario === undefined) {
    throw new AutenticacaoInvalida();
  }
  return usuario;
}

function gerarId (): IdAutenticacao {
  return uuidv4();
}
