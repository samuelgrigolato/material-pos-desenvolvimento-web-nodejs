import { v4 as uuidv4 } from 'uuid';
import util from 'util';

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
  if (usuario?.senha !== senha) {
    throw new Error('Login ou senha inválidos');
  }
  const id = gerarId();
  autenticacoes[id] = usuario;
  return id;
}

export async function recuperarUsuarioAutenticado (token: IdAutenticacao): Promise<Usuario> {
  await pausar(25);
  const usuario = autenticacoes[token];
  if (usuario === undefined) {
    throw new Error('Token inválido');
  }
  return usuario;
}

function gerarId (): IdAutenticacao {
  return uuidv4();
}
