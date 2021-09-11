
export class DadosOuEstadoInvalido extends Error {
  constructor(codigo, descricao) {
    super(descricao);
    this.codigo = codigo;
    this.statusCode = 422;
  }
}

export class UsuarioNaoAutenticado extends Error {
  constructor() {
    super('Usuário não autenticado.');
    this.statusCode = 401;
  }
}

export class TokenInvalido extends Error {
  constructor() {
    super('Token inválido.');
    this.statusCode = 401;
  }
}

export class AcessoNegado extends Error {
  constructor() {
    super('Acesso negado.');
    this.statusCode = 403;
  }
}
