import { v4 as uuidv4 } from 'uuid';
import util from 'util';
import sequelizeLib, { Model } from 'sequelize';

import sequelize from '../shared/orm';
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

const autenticacoes: { [key: IdAutenticacao]: Usuario } = {};

class UsuarioORM extends Model {
  public id!: number;
  public nome!: string;
  public login!: string;
  public senha!: string;
  public admin!: boolean;
}
UsuarioORM.init({
  nome: sequelizeLib.DataTypes.STRING,
  login: sequelizeLib.DataTypes.STRING,
  senha: sequelizeLib.DataTypes.STRING,
  admin: sequelizeLib.DataTypes.BOOLEAN,
}, {
  sequelize,
  tableName: 'usuarios',
});

export async function autenticar (login: Login, senha: Senha): Promise<IdAutenticacao> {
  const usuario = await UsuarioORM.findOne({ where: { login } });
  if (usuario === null || usuario.senha !== senha) {
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

export async function alterarNome (usuario: Usuario, novoNome: string): Promise<void> {
  await pausar(25);
  usuario.nome = novoNome; // isso funciona pois a referência é a mesma!
  // em um cenário real, teríamos uma chamada SQL aqui
}

function gerarId (): IdAutenticacao {
  return uuidv4();
}
