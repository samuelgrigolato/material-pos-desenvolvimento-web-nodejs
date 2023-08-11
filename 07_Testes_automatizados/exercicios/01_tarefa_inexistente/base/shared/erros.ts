
export abstract class ErroNoProcessamento extends Error {
  readonly statusCode: number;

  constructor (message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
  }

  toJSON (): Record<string, any> {
    return {
      mensagem: this.message
    };
  }
}

export class DadosOuEstadoInvalido extends ErroNoProcessamento {
  readonly extra: any;

  constructor (descricao: string, extra: any) {
    super(descricao, 422);
    this.extra = extra;
  }

  toJSON () {
    return {
      ...super.toJSON(),
      extra: this.extra
    };
  }
}

export class UsuarioNaoAutenticado extends ErroNoProcessamento {
  constructor () {
    super('Usuário não autenticado.', 401);
  }
}

export class AutenticacaoInvalida extends ErroNoProcessamento {
  constructor () {
    super('Token inválido.', 401);
  }
}

export class AcessoNegado extends ErroNoProcessamento {
  constructor () {
    super('Acesso ao recurso solicitado foi negado.', 403);
  }
}
