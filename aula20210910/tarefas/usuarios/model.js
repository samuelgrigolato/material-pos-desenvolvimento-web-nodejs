import util from 'util';
import { v4 as uuidv4 } from 'uuid';

const pausar = util.promisify(setTimeout);

const usuarios = {
  pedro: {
    nome: 'Pedro',
    senha: '123456' // na prática obviamente seria um bcrypt
  },
  clara: {
    nome: 'Clara',
    senha: '234567'
  }
};

const autenticacoes = {
  'f3a86b8f-49a7-4f97-bea0-78990c5cd9b1': 'pedro',
  'a2a011ef-b6c5-471f-98cd-95837c7bdea5': 'clara'
};

export async function autenticar (login, senha) {
  await pausar(25);
  const usuario = usuarios[login];
  if (usuario === undefined) {
    throw new Error('Usuário não existe.');
  }
  if (usuario.senha !== senha) {
    throw new Error('Senha inválida');
  }
  const autenticacao = uuidv4();
  autenticacoes[autenticacao] = login;
  return autenticacao;
}

export async function recuperarLoginDoUsuarioAutenticado (autenticacao) {
  if (autenticacao === undefined) {
    throw new Error('Token é necessário para autenticar.');
  }
  await pausar(25);
  const login = autenticacoes[autenticacao];
  if (login === undefined) {
    throw new Error('Token inválido.');
  }
  return login;
}
