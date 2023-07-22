import { v4 as uuidv4 } from 'uuid';
import util from 'util';

import { AutenticacaoInvalida, DadosOuEstadoInvalido } from '../shared/erros';
import { conectar } from '../shared/db';

const pausar = util.promisify(setTimeout);

type UUIDString = string;
type IdAutenticacao = UUIDString;
type Senha = string;
export type Login = string;

export type Usuario = {
  nome: string;
  login: Login;
  senha: Senha;
  admin: boolean; // poderia ser também um enum, por exemplo: tipo: 'admin' | 'usuario'
}

const usuarios: Usuario[] = [
  {
    nome: 'Pedro',
    login: 'pedro',
    senha: '123456',
    admin: false,
  },
  {
    nome: 'Clara',
    login: 'clara',
    senha: '234567',
    admin: true,
  },
];

const autenticacoes: { [key: IdAutenticacao]: Usuario } = {};

export async function autenticar (login: Login, senha: Senha): Promise<IdAutenticacao> {
  const conexao = await conectar();
  try {
    const res = await conexao.query(
      'select nome, senha, admin from usuarios where login = $1',
      [ login ]
    );
    const row = res.rows[0];
    if (row === undefined || row.senha !== senha) {
      throw new DadosOuEstadoInvalido('Login ou senha inválidos', {
        codigo: 'CREDENCIAIS_INVALIDAS'
      });
    }
    const id = gerarId();
    autenticacoes[id] = {
      login,
      ...row, // repare que row é do tipo any, por isso o TypeScript não reclama
    };
    return id;
  } finally {
    await conexao.end();
  }
}

export async function recuperarUsuarioAutenticado (token: IdAutenticacao): Promise<Usuario> {
  await pausar(25);
  const usuario = autenticacoes[token];
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
