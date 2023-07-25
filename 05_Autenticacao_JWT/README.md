# Autenticação usando Json Web Token

Pare um momento para refletir sobre o sistema de autenticação desenvolvido para a nossa API. O fato de exigir uma consulta no banco de dados a cada checagem de permissão dificulta um pouco a escala desse processo, além de exigir que qualquer sistema que precise autenticar o usuário com base no token acabe acessando o banco de dados de uma forma ou de outra eventualmente. Esses atributos tornam a solução inadequada para determinados tipos de APIs.

Mas como resolver? Parece intuitivo que seja necessária uma base de tokens e que o backend tenha que consultá-la para ter certeza de que o usuário é quem diz ser, certo? Por mais que seja intuitivo, essa premissa é falsa, como vamos ver.

Imagine que você pudesse escrever algo em um papel, entregar para alguém desconhecido, recebê-lo futuramente e ter absoluta certeza que ele não foi alterado e que as informações ali foram realmente escritas por você no passado. Isso é possível hoje no mundo digital através de assinaturas digitais, que por baixo usam algum mecanismo baseado em chave única/criptografia simétrica ou par de chaves/criptografia assimétrica.

No mundo das assinaturas com chave única (simétrica) temos como um bom exemplo o HMAC sobre SHA-256: https://www.devglan.com/online-tools/hmac-sha256-online. E no mundo das assimétricas nós temos por exemplo a RSA: https://www.devglan.com/online-tools/rsa-encryption-decryption.

Pense agora na seguinte solução: o usuário te convence de que é ele mesmo no endpoint/serviço de autenticação, via qualquer meio que você julgar suficiente: login/senha, rede social, biometria, certificado digital etc. Você devolve um texto que o identifica (por exemplo o ID do usuário na base de dados do sistema) junto uma data de expiração e uma *assinatura digital* usando HMAC SHA-256, RSA ou similar. No futuro, sempre que este usuário quiser executar alguma ação, basta ele enviar este *token* (que é seu ID mais a assinatura digital) e qualquer sistema seu que possua a chave capaz de validar a assinatura pode autenticá-lo sem a necessidade de acesso à base de dados de tokens.

Mas onde entra o JWT? É só um padrão de envio dessas informações permitindo que várias bibliotecas em várias linguagens e plataformas possam falar a mesma língua, facilitando muito a troca de tokens entre sistemas. A melhor forma de entender seu funcionamento é explorar através da ferramenta https://jwt.io: basta adicionar chaves no cabeçalho, corpo, preencher uma chave simétrica ou inserir uma chave pública RSA no campo apropriado e ver a mágica acontecer.

Com esse conhecimento somos agora capazes de desenhar uma refatoração na nossa API de modo a deixar de usar a tabela de autenticações no banco de dados e passar a usar JWT no lugar para autenticar os usuários. Esse processo possui as seguintes etapas:

1. Adaptar o método `autenticar` no arquivo `usuarios/model.ts` para retornar um JWT ao invés de inserir um registro na tabela de autenticações;
2. Adaptar o método `recuperarUsuarioAutenticado` no arquivo `usuarios/model.ts` para validar o JWT recebido;
3. Criar uma migração para remover a tabela de autenticações.

Reflexão: leia novamente esses passos, principalmente o 3, e imagine que sua API já está sendo utilizada por usuários e não pode parar. Como fazer para evitar a interrupção durante o processo de refatoração do mecanismo de autenticação?

Vamos começar a implementação escolhendo uma biblioteca Node.js para gerar e validar o token. No próprio https://jwt.io é possível encontrar sugestões. Vamos usar a `jsonwebtoken` da Auth0.

Leitura interessante sobre uma falha de segurança que era bem comum nos primeiros dias do JWT: https://auth0.com/blog/critical-vulnerabilities-in-json-web-token-libraries.

Comece instalando a biblioteca:

```sh
$ npm install jsonwebtoken
$ npm install --save-dev @types/jsonwebtoken
```

Agora adapte o arquivo `usuarios/model.ts`:

```ts
import jwt from 'jsonwebtoken';

...

type TokenJWT = string;
type TokenAutenticacao = TokenJWT;
type Senha = string;
export type Login = string;

...

const JWT_SECRET = (() => {
  const env = process.env.JWT_SECRET;
  if (env === undefined || env === '') {
    throw new Error('Env JWT_SECRET não definida.');
  }
  return env;
})();

...

export async function autenticar (login: Login, senha: Senha, uow: Knex): Promise<TokenAutenticacao> {
  const usuario = await uow('usuarios')
    .select('senha')
    .where({ login })
    .first();
  if (usuario === undefined || (await senhaInvalida(senha, usuario.senha))) {
    throw new DadosOuEstadoInvalido('Login ou senha inválidos', {
      codigo: 'CREDENCIAIS_INVALIDAS'
    });
  }
  return jwt.sign({
    login,
    exp: Math.floor(new Date().getTime() / 1000) + 10 * 24 * 60 * 60 /* 10 dias */
  }, JWT_SECRET);
}

...

export async function recuperarUsuarioAutenticado (token: TokenJWT, uow: Knex): Promise<Usuario> {
  let login: string;
  try {
    const payload = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload;
    login = payload.login;
  } catch (e: any) {
    if (!['jwt expired', 'invalid signature'].includes(e.message)) {
      console.warn(e);
    }
    throw new AutenticacaoInvalida();
  }
  const usuario = await uow('usuarios')
    .select<Usuario>('id', 'login', 'senha', 'nome', 'admin')
    .where('login', login)
    .first();
  if (usuario === undefined) {
    throw new AutenticacaoInvalida();
  }
  return usuario;
}
```

Adicione a variável `JWT_SECRET` no script do `package.json`:

```json
  "scripts": {
    "build": "rm -rf build && tsc -p tsconfig.json",
    "start": "cd build && JWT_SECRET=123456 node app.js"
  },
```
