import { v4 as uuidv4 } from 'uuid';
import util from 'util';

const pausar = util.promisify(setTimeout);

type UUIDString = string;
type IdAutenticacao = UUIDString;
type Senha = string;

export type Login = string;

const usuarios: { [key: Login]: Senha } = {
  'pedro': '123456',
  'clara': '234567',
};

const autenticacoes: { [key: IdAutenticacao]: Login } = {};

export async function autenticar (login: Login, senha: Senha): Promise<IdAutenticacao> {
  await pausar(25);
  if (usuarios[login] !== senha) {
    throw new Error('Login ou senha inválidos');
  }
  const id = gerarId();
  autenticacoes[id] = login;
  return id;
}

export async function recuperarLoginDoUsuarioAutenticado (token: IdAutenticacao): Promise<Login> {
  await pausar(25);
  const login = autenticacoes[token];
  if (login === undefined) {
    throw new Error('Token inválido');
  }
  return login;
}

function gerarId (): IdAutenticacao {
  return uuidv4();
}
