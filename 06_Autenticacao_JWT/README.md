# Autenticação usando Json Web Token

Pare um momento para refletir sobre o sistema de autenticação desenvolvido para a nossa API. O fato de exigir uma consulta no banco de dados a cada checagem de permissão dificulta um pouco a escala desse processo, além de exigir que qualquer sistema que precise autenticar o usuário com base no token acabe acessando o banco de dados de uma forma ou de outra eventualmente. Esses atributos tornam a solução inadequada para determinados tipos de APIs.

Mas como resolver? Parece intuitivo que seja necessária uma base de tokens e que o backend tenha que consultá-la para ter certeza de que o usuário é quem diz ser, certo? Por mais que seja intuitivo, essa premissa é falsa, como vamos ver.

Imagine que você pudesse escrever algo em um papel, entregar para alguém desconhecido, recebê-lo futuramente e ter absoluta certeza que ele não foi alterado e que as informações ali foram realmente escritas por você no passado. Isso é possível hoje no mundo digital através de assinaturas digitais, que por baixo usam algum mecanismo baseado em chave única/criptografia simétrica ou par de chaves/criptografia assimétrica.

No mundo das assinaturas com chave única (simétrica) temos como um bom exemplo o HMAC sobre SHA-256: https://www.devglan.com/online-tools/hmac-sha256-online. E no mundo das assimétricas nós temos por exemplo a RSA: https://www.devglan.com/online-tools/rsa-encryption-decryption.

Pense agora na seguinte solução: o usuário te convence de que é ele mesmo no endpoint/serviço de autenticação, via qualquer meio que você julgar suficiente: login/senha, rede social, biometria, certificado digital etc. Você devolve um texto que o identifica (por exemplo o ID do usuário na base de dados do sistema) junto uma data de expiração e uma *assinatura digital* usando HMAC SHA-256, RSA ou similar. No futuro, sempre que este usuário quiser executar alguma ação, basta ele enviar este *token* (que é seu ID mais a assinatura digital) e qualquer sistema seu que possua a chave capaz de validar a assinatura pode autenticá-lo sem a necessidade de acesso à base de dados de tokens.

Mas onde entra o JWT? É só um padrão de envio dessas informações permitindo que várias bibliotecas em várias linguagens e plataformas possam falar a mesma língua, facilitando muito a troca de tokens entre sistemas. A melhor forma de entender seu funcionamento é explorar através da ferramenta https://jwt.io: basta adicionar chaves no cabeçalho, corpo, preencher uma chave simétrica ou inserir uma chave pública RSA no campo apropriado e ver a mágica acontecer.

Com esse conhecimento somos agora capazes de desenhar uma refatoração na nossa API de modo a deixar de usar a tabela de autenticações no banco de dados e passar a usar JWT no lugar para autenticar os usuários. Esse processo possui as seguintes etapas:

1. Adaptar o método `autenticar` no arquivo `usuarios/model.js` para retornar um JWT ao invés de inserir um registro na tabela de autenticações;
2. Adaptar o método `recuperarLoginDoUsuarioAutenticado` no arquivo `usuarios/model.js` para validar o JWT recebido;
3. Criar uma migração para remover a tabela de autenticações.

Reflexão: leia novamente esses passos, principalmente o 3, e imagine que sua API já está sendo utilizada por usuários e não pode parar. Como fazer para evitar a interrupção durante o processo de refatoração do mecanismo de autenticação?

Vamos começar a implementação escolhendo uma biblioteca Node.js para gerar e validar o token. No próprio https://jwt.io é possível encontrar sugestões. Vamos usar a `jsonwebtoken` da Auth0.

Leitura interessante sobre uma falha de segurança que era bem comum nos primeiros dias do JWT: https://auth0.com/blog/critical-vulnerabilities-in-json-web-token-libraries.

Comece instalando a biblioteca:

```sh
$ npm install jsonwebtoken
```

Agora adapte a função `autenticar` no arquivo `usuarios/model.js`:

```js
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

import { AutenticacaoInvalida, DadosOuEstadoInvalido, UsuarioNaoAutenticado } from '../erros.js';
import knex from '../querybuilder.js';


const JWT_SECRET = process.env.JWT_SECRET;
if (JWT_SECRET === undefined || JWT_SECRET === '') {
  throw new Error('Env JWT_SECRET não definida.');
}


export async function autenticar (login, senha) {
  const res = await knex('usuarios')
    .where('login', login)
    .select('id', 'senha');
  if (res.lenght === 0) {
    throw new DadosOuEstadoInvalido('CredenciaisInvalidas', 'Credenciais inválidas.');
  }
  const usuario = res[0];
  if (!bcrypt.compareSync(senha, usuario.senha)) {
    throw new DadosOuEstadoInvalido('CredenciaisInvalidas', 'Credenciais inválidas.');
  }
  return jwt.sign({
    login,
    exp: Math.floor(new Date().getTime() / 1000) + 10 * 24 * 60 * 60 /* 10 dias */
  }, JWT_SECRET);
}
//...
```

Adapte agora o método `recuperarLoginDoUsuarioAutenticado`, considerando que o parâmetro `autenticacao` agora carrega um JWT ao invés de um GUID:

```js
export async function recuperarLoginDoUsuarioAutenticado (autenticacao) {
  let tokenVerificado;
  try {
    tokenVerificado = jwt.verify(autenticacao, JWT_SECRET);
  } catch (err) {
    if (err.message !== 'invalid signature') {
      console.warn(err);
    }
    throw new AutenticacaoInvalida();
  }
  return tokenVerificado['login'];
}
```

Proposta de exercício: mude o tempo de validade do token JWT para poucos segundos e verifique o que acontece quando você tenta utilizá-lo. Silencie o ruído nos logs da mesma forma que ocorre com a assinatura inválida.

A primeira parte é simples:

```js
exp: Math.floor(new Date().getTime() / 1000) + 10 /* 10 segundos */
```

E o silenciamento do ruído no console:

```js
} catch (err) {
  if (err.message !== 'invalid signature' && err.message !== 'jwt expired') {
    console.warn(err);
  }
  throw new AutenticacaoInvalida();
}
```

## Pooling de conexão

Recapture na memória (ou no seu sistema de arquivos) a implementação de acesso a banco de dados que utilizou conexão direta usando `pg`. Cada requisição criava e fechada sua própria conexão com o banco de dados. Note que com `knex` não fica claro exatamente como isso ocorre, e de fato o comportamento é diferente. Como a criação e fechamento de conexões com banco de dados é um processo custoso e relativamente lento, é uma boa ideia manter um *conjunto* (pool) de conexões sempre abertas e reutilizá-las para atender as requisições. Por padrão o `knex` usa um gestor de pool chamado `tarn` com configuração de 2 no mínimo e 10 conexões no máximo abertas simultâneamente. Detalhes: https://knexjs.org/#Installation-pooling.
