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
  'f3a86b8f-49a7-4f97-bea0-78990c5cd9b1': 'pedro'
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
