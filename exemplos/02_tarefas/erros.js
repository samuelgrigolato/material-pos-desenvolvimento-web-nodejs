
export class DadosOuEstadoInvalido extends Error {
  constructor (codigo, descricao, extra) {
    super(descricao);
    this.codigo = codigo;
    this.statusCode = 422;
    this.extra = extra;
  }
}

export class UsuarioNaoAutenticado extends Error {
  constructor () {
    super('Um usuário é necessário para efetuar esta chamada.');
    this.statusCode = 401;
  }
}

export class AutenticacaoInvalida extends Error {
  constructor () {
    super('Autenticação inválida.');
    this.statusCode = 403;
  }
}

export class AcessoNegado extends Error {
  constructor () {
    super('Acesso ao recurso solicitado foi negado.');
    this.statusCode = 403;
  }
}
