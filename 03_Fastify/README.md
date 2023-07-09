# Fastify

Vamos começar com a definição do domínio/solução que iremos desenvolver:

> Um controle de tarefas (TODO), com suporte para anexos, etiquetas, categorias, subtarefas. Tarefas e subtarefas podem ser concluídas e reabertas. A aplicação deve ficar protegida por autenticação e cada usuário deve ter acesso apenas ao seu próprio conjunto de tarefas.

A API será desenvolvida usando endpoints HTTP no estilo "REST" (cuidado com o campo minado), em conjunto com alguns endpoints no estilo RPC para algumas ações específicas. No meio do caminho aprenderemos a documentar a API usando a especificação OpenAPI (sucessora da especificação Swagger). Iniciaremos com autenticação básica e também stateful, mas eventualmente migraremos para autenticação baseada em JWT.

## História do Fastify

Descrito como "Fast and low overhead web framework, for Node.js", o Fastify é um framework desenvolvido desde 2016, inspirado em partes pelo Express e pelo Hapi.

## Primeiro endpoint, cadastrando uma tarefa

Para cadastrar uma nova tarefa o cliente da API deverá fornecer as seguintes informações:

- Descrição (texto livre);
- Categoria (identificador);
- Lista de etiquetas iniciais (opcional).

Eventualmente essa tarefa ficará vinculada com o usuário, mas por enquanto teremos apenas acesso não autenticado.

Crie um diretório vazio, e dentro dele crie um arquivo chamado `package.json` com o seguinte conteúdo:

```json
{
  "private": true,
  "type": "module"
}
```

Mais a frente veremos com detalhes o papel do Node Package Manager (NPM) no processo. Instale agora o Fastify usando o seguinte comando:

```sh
$ npm install fastify
```

Instale também o pacote de tipos TypeScript para código Node 18:

```sh
$ npm install --save-dev @types/node@18
```

Veja o que mudou no `package.json` e também note que apareceu um arquivo gigante chamado `package-lock.json`. Ambos serão explicados posteriormente.

Caso esteja em um repositório git, lembre-se de criar um arquivo `.gitignore`, caso ainda não tenha, e adicionar uma linha com o texto `node_modules` nele, para evitar versionar as dependências do Node.js junto com o código-fonte do seu projeto.

Instale agora o `typescript` como ferramenta de desenvolvimento:

```sh
$ npm install --save-dev typescript
```

Configure um novo projeto TypeScript neste diretório:

```sh
$ npx tsc --init
```

A documentação do Fastify sugere usar `es2017` como target, para evitar notificações de descontinuação. Então façamos isso (arquivo `tsconfig.json`):

```json
  "target": "es2017",
```

Agora adicione os seguintes scripts no `package.json`, para facilitar no desenvolvimento:

```json
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "start": "node app.js"
  },
```

Uma vez com o Fastify instalado, é possível utilizá-lo. Crie um arquivo `app.ts` com o seguinte conteúdo:

```js
import fastify from 'fastify';

const app = fastify({ logger: true });

app.get('/hello', async (_req, _resp) => {
  return { hello: 'world' };
});

async function main() {
  try {
    await app.listen({ port: 3000 });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}
main();
```

É possível construir e rodar a aplicação desse jeito, usando os seguintes comandos:

```sh
$ npm run build
$ npm run start
```

É possível ainda testá-la usando cUrl/HTTPie/Postman:

```sh
$ curl -v http://localhost:3000/hello
```

Observe que no Fastify, assim como no módulo `http` do Node.js, a resposta é enviada através de uma chamada no objeto `res` (segundo parâmetro) ou retornando algo da função processadora. Vamos simular um cadastro de tarefas criando uma camada de modelo que expõe essa funcionalidade. Crie um arquivo chamado `tarefas/model.ts`:

```ts
import util from 'util';

const pausar = util.promisify(setTimeout);

export interface DadosTarefa {
  descricao: string;
}

type IdTarefa = number;

// não usado por enquanto
type Tarefa = DadosTarefa & { id: IdTarefa };

export async function cadastrarTarefa(dados: DadosTarefa): Promise<IdTarefa> {
  await pausar(100);
  console.log('cadastrou', dados);
  return 1;
}
```

Use o método agora no arquivo `app.js`:

```ts
import { cadastrarTarefa, DadosTarefa } from './tarefas/model';

app.post('/tarefas', async (req, resp) => {
  const dados = req.body as DadosTarefa;
  const id = await cadastrarTarefa(dados);
  resp.status(201);
  return { id };
});
```

O que acontece se o método `cadastrarTarefa` disparar um erro?

```js
export async function cadastrarTarefa (tarefa) {
  await pausar(1000);
  throw Error('algo deu errado');
  console.log('cadastrou', tarefa);
  return 1;
}
```

Antes de passar para um exercício, armazene as tarefas recebidas em um array. Note que neste momento não estamos validando nada na entrada, faremos isso mais a frente.

```ts
import util from 'util';

const pausar = util.promisify(setTimeout);

let sequencial = 0;
const tarefas = [];

export async function cadastrarTarefa (tarefa) {
  await pausar(1000);
  sequencial++;
  tarefas.push({
    id: sequencial,
    ...tarefa
  });
  console.log('cadastrou', tarefa);
  return sequencial;
}
```

[Exercício 01_get_tarefas](exercicios/01_get_tarefas/README.md)

## Aspectos recorrentes no desenvolvimento backend

Existem algumas preocupações recorrentes no desenvolvimento de APIs:

- *Processamento do corpo da requisição:* um framework deve ajudar a esconder a complexidade do protocolo HTTP e entregar dados úteis para o código que vai processá-los, sem prejudicar demasiadamente a performance e robustez;

- *Roteamento da requisição:* a combinação do método e do caminho deve ser usada para rotear a requisição para as mais diversas funcionalidades oferecidas pela API. Parâmetros de rota (normalmente identificadores de registros) são um aspecto complicador desse sistema;

- *Tratamento de casos de erro:* para a API ser considerada resiliente, ela deve se comportar de modo previsível e documentado independente da situação das dependências de infraestrutura (ex: banco de dados fora do ar), e até mesmo quando ocorrerem erros de desenvolvimento;

- *Upload/download de arquivos*: desde simples anexos até processamento de grandes planilhas, lidar com arquivos é sem dúvida uma constante nas APIs;

- *Segurança:* normalmente uma API vai precisar autenticar e autorizar acesso dos seus usuários.

## Hooks

Algumas características das nossas APIs devem se aplicar de forma homogênea independentemente do endpoint. Um exemplo é a autenticação, visto que não faz sentido duplicarmos o código que autentica nosso usuário em todos os endpoints. Para esse tipo de situação o Fastify oferece o conceito de `hooks`. Para verificar seu funcionamento, crie um novo diretório, dentro dele um arquivo `app.js` (não se esqueça também do `package.json`, `tsconfig.json` e `.gitignore`) e adicione o código abaixo:

```js
import fastify from 'fastify';

const app = fastify({ logger: true });

app.addHook('onRequest', async (_req, _res) => {
  console.log('onRequestHook');
});

app.addHook('onSend', async (_req, _res) => {
  console.log('onSendHook');
});

app.get('/usuario', async (_req, res) => {
  console.log('endpoint-inicio');
  await res.send({
    login: 'alguem',
    nome: 'Alguém'
  });
  console.log('endpoint-fim');
});

async function main() {
  try {
    await app.listen({ port: 3000 });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}
main();
```

O Fastify oferece uma grande quantidade de hooks. Veja o ciclo de vida completo de uma requisição [aqui](https://fastify.dev/docs/latest/Reference/Lifecycle).

Uma das funcionalidades mais poderosas dos hooks é a interceptação de uma requisição. Com ela, é possível interromper o processamento normal enviando uma resposta de forma prematura. Isso é feito simplesmente chamando o método `reply.send` dentro do hook. Veja:

```ts
app.addHook('onRequest', async (_req, res) => {
  console.log('onRequestHook');
  res.status(403).send({ error: 'Não autorizado' });
});
```

Note que os hooks em seguida no ciclo de vida, bem como o handler principal, *não* são executados neste caso. Todo o pipeline de processamento da resposta é executado normalmente, no entanto.

## Plugins

Uma outra funcionalidade importante do Fastify é a sua estrutura de plugins. Com ela é possível injetar novas funcionalidades na sua aplicação.

Um bom exemplo é o plugin `fastify-static`. Ele é usado para facilitar a disponibilização de recursos estáticos através da sua API. Sua instalação é simples e feita através do registro de um plugin na instância fastify. Primeiro instale a dependência no projeto:

```sh
$ npm install @fastify/static
```

Agora instale-o no arquivo `app.js`:

```ts
import fastifyStatic from '@fastify/static';

app.register(fastifyStatic, {
  root: `${__dirname}/public`,
  prefix: '/public/',
});
```

Crie uma pasta chamada `public` e um arquivo `teste.txt` dentro dela, com qualquer conteúdo.

Suba o servidor e teste com a seguinte chamada (lembre-se de adaptar de acordo com o cliente HTTP de sua preferência):

```
$ http get http://localhost:3000/public/teste.txt
```

Desenvolver plugins customizados é bem simples. O primeiro parâmetro da chamada `app.register` precisa apenas ser uma função que recebe três parâmetros: `fastify`, `opts` e `done` (este último pode ser omitido se a função for `async`, assim como handlers). Veja um exemplo de plugin que registra um simples ping:

```ts
app.register(async function (instance, _opts) {

  instance.get('/ping', async (_req, res) => {
    await res.send('pong\n');
  });

});
```

Vamos agora adicionar um hook `onRequest` dentro do plugin:

```ts
app.register(async function (instance, _opts) {

  instance.addHook('onRequest', async (_req, res) => {
    console.log('onRequestHook-dentro do plugin');
  });

  // ...

});
```

Repare que o hook é executado quando a rota do ping é chamada, mas não o é quando a rota é GET /usuario. Isso acontece pois cada plugin no Fastify cria um *contexto de encapsulamento*. É possível evitar isso usando o plugin `fastify-plugin` (sim, nome confuso) na hora de registrar o seu plugin. Veja a diferença:

```sh
$ npm i fastify-plugin
```

```ts
import fastifyPlugin from 'fastify-plugin';

app.register(fastifyPlugin(async function (instance, _opts) {
```

## Autenticação Stateful

Como garantir que o usuário é quem diz ser? E, uma vez feito isso, como impedir que este usuário acesse dados ou execute operações que não possui acesso? Essas são as responsabilidades dos sistemas de autenticação (quem é você?) e autorização (você pode ou não fazer isso). Existem diversas maneiras de se autenticar um usuário, e abordaremos duas aqui, são elas:

- Autenticação stateful, onde o usuário chama um endpoint de login passando suas credenciais e obtém um identificador que, ao ser enviado em futuras requisições, permite ao servidor saber quem é o usuário. Note que o servidor precisa manter uma relação entre esses identificadores e o usuário, por isso chamamos essa autenticação de stateful;

- Autenticação stateless usando JWT: bem similar à autenticação stateful, mas o servidor devolve um token que carrega a informação do login do usuário, junto com uma assinatura que não pode ser forjada. Em futuras requisições, basta verificar essa assinatura para garantir que aquele token foi mesmo gerado em uma autenticação anterior.

Para começar o desenvolvimento da versão stateless, faça uma cópia da solução do exercício [01_get_tarefas](exercicios/01_get_tarefas/README.md) e instale o pacote `uuid` (usaremos ele para gerar o identificador das sessões):

```sh
$ npm i uuid
$ npm i --save-dev @types/uuid
```

Agora crie um diretório chamado `usuarios` e, dentro dele, um arquivo chamado `model.ts` com o seguinte conteúdo:

```ts
type UUIDString = string;

type IdAutenticacao = UUIDString;

export async function autenticar (login: string, senha: string): Promise<IdAutenticacao> {
  return '4a9b7d2a-f0e2-4b9b-8609-c6ec27791b06';
}
```

Essa versão nos permite entender qual o contrato da função autenticar com os futuros módulos consumidores (exceto a parte de possíveis exceções). Vamos mudar um pouco para que a implementação fique mais completa:

```ts
import { v4 as uuidv4 } from 'uuid';
import util from 'util';

const pausar = util.promisify(setTimeout);

type UUIDString = string;
type IdAutenticacao = UUIDString;
type Login = string;
type Senha = string;

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

function gerarId (): IdAutenticacao {
  return uuidv4();
}
```

Adicione agora o seguinte endpoint no arquivo `app.js`:

```ts
import { autenticar } from './usuarios/model';

...

app.post('/usuarios/login', async (req, resp) => {
  const { login, senha } = req.body as { login: string, senha: string };
  const id = await autenticar(login, senha);
  return { token: id };
});
```

Teste com o seguinte comando HTTPie ou equivalente:

```
$ http -v post http://localhost:3000/usuarios/login login=inexistente senha=errada
```

Note como o erro retornado é um erro 500 (neste caso o ideal seria um erro 400).

Teste agora com dados válidos:

```
$ http -v post http://localhost:3000/usuarios/login login=clara senha=234567
```

Isso cuida da geração do token, mas e o uso? A melhor maneira de implementar é através de um hook que verifica se existe o header `Authorization` (péssimo nome, infelizmente, pois estamos falando de autenticação). Esse header tem várias opções de preenchimento, no nosso caso o que mais se aproxima é o formato `Bearer [TOKEN]`, ex: `Bearer 934e2282-077b-440a-9ecc-350d658d2cb5`. Antes de mais nada adicione uma função no arquivo `usuarios\model.js` que retorna o login do usuário dado um ID de autenticação:

```ts
export async function recuperarLoginDoUsuarioAutenticado (token: IdAutenticacao): Promise<Login> {
  await pausar(25);
  const login = autenticacoes[token];
  if (login === undefined) {
    throw new Error('Token inválido');
  }
  return login;
}
```

E agora o hook que faz a verificação e, caso haja o header, incrementa o objeto da requisição com os dados do usuário:

```ts
app.addHook('preHandler', async (req, resp) => {
  const { authorization } = req.headers as { authorization?: string };
  if (authorization !== undefined) {
    const token = authorization.replace('Bearer ', '');
    const login = await recuperarLoginDoUsuarioAutenticado(token);
    req.loginDoUsuario = login;
  }
  // não queremos disparar um erro se o usuário não estiver autenticado neste ponto,
  // pois algumas rotas podem ser públicas
});
```

Repare que a linha `req.loginDoUsuario = login` está apresentando um erro de compilação TypeScript. Isso faz sentido, afinal o tipo `FastifyRequest` não sabe o que é um usuário. São necessárias duas etapas para resolver este problema:

1. Chamar a função `decorateRequest`, na instância do Fastify, para dizer ao framework que requests podem possuir um valor neste atributo. Isso é necessário por conta de otimizações internas do framework:

```ts
app.decorateRequest('loginDoUsuario', null);
```

2. Augmentar a declaração do tipo `FastifyRequest` com a propriedade `usuario`. Aqui veremos a utilização de declarações pela primeira vez, uma forma de fazer a ponte entre código JavaScript e TypeScript. Sempre que você instala um pacote com o nome `@types/abc` se trata de um pacote com esses arquivos de declaração e nada mais. Comece com a augmentação no próprio arquivo `app.ts`:

```ts
declare module 'fastify' {
  interface FastifyRequest {
    loginDoUsuario: Login | null;
  }
}
```

Por mais que essa solução já é suficiente, a boa prática é agrupar todas essas definições na pasta `@types` do projeto. Crie um arquivo `@types/fastify/index.d.ts` e mova o código para dentro deste arquivo:

```ts
import fastify from 'fastify'; // essa linha é muito importante! caso contrário ocorre uma substituição/shadowing do módulo fastify
import { Login } from 'usuarios/model';

declare module 'fastify' {
  interface FastifyRequest {
    loginDoUsuario: Login | null;
  }
}
```

Repare que essa definição é global, e você pode ter múltiplas instâncias do fastify (incluindo especificidades de cada contexto de plugin) em uma mesma base de código. Infelizmente [não há incentivo suficiente para isso ser resolvido](https://github.com/fastify/fastify/issues/2110).

Neste ponto temos tudo o que precisamos para implementar a *autorização*. Comece mudando o arquivo `tarefas/model.ts` para que ele ofereça suporte para o conceito de usuário logado:

```ts
import util from 'util';

import { Login } from '../usuarios/model';

const pausar = util.promisify(setTimeout);

export interface DadosTarefa {
  descricao: string;
}

type IdTarefa = number;

type Tarefa =
  DadosTarefa
  & {
    id: IdTarefa,
    loginDoUsuario: Login,
  };

let sequencial: number = 0;
const tarefas: Tarefa[] = [];

export async function cadastrarTarefa(loginDoUsuario: Login | null, dados: DadosTarefa): Promise<IdTarefa> {
  if (loginDoUsuario === null) {
    throw new Error('Usuário não autenticado');
  }
  await pausar(100);
  sequencial++;
  const idTarefa = sequencial;
  const tarefa = {
    ...dados,
    id: idTarefa,
    loginDoUsuario,
  };
  tarefas.push(tarefa);
  console.log('cadastrou', tarefa);
  return idTarefa;
}

export async function consultarTarefas(loginDoUsuario: Login | null, termo?: string): Promise<Tarefa[]> {
  if (loginDoUsuario === null) {
    throw new Error('Usuário não autenticado');
  }
  await pausar(100);
  return tarefas
    .filter(x => x.loginDoUsuario === loginDoUsuario) // essa aqui é a linha que aplica autorização!
    .filter(x => !termo || x.descricao.includes(termo));
}
```

Note que é necessário exportar o tipo `Login` no arquivo `usuarios/model.ts` para que o import funcione:

```ts
export type Login = string;
```

E adapte agora no arquivo `app.ts`:

```js
app.post('/tarefas', async (req, resp) => {
  const dados = req.body as DadosTarefa;
  const id = await cadastrarTarefa(req.loginDoUsuario, dados);
  resp.status(201);
  return { id };
});

app.get('/tarefas', async (req, resp) => {
  const { termo } = req.query as { termo?: string };
  const tarefas = await consultarTarefas(req.loginDoUsuario, termo);
  return tarefas;
});
```

Agora é um bom momento para começar a usar uma ferramenta como Insomnia ou Postman para os testes.

Proposta de exercício: adicionar um atributo boolean chamado `admin` nos usuários, e caso este atributo seja true permitir que este usuário veja as tarefas de todos os outros. Este é um tipo de autorização baseada em perfil, diferente e normalmente complementar à autorização baseada no dado que aplicamos anteriormente.

## Melhorando a apresentação de erros 404, 422, 401 e 403

Parando para analisar os endpoints que construímos até o momento é possível observar um problema: qualquer tipo de erro é reportado com o status code 500, o que é bem ruim do ponto de vista do consumidor da nossa API. O ideal seria começarmos a utilizar os status codes que previmos no início:

- 404 para rotas inválidas (caminho e método);
- 400 para dados de entrada em formato inválido;
- 422 para dados de entrada em formato válido mas conteúdo incorreto (ex: credenciais inválidas no POST de login);
- 401 caso um endpoint necessite de um usuário logado mas não tenha recebido um;
- 403 caso um endpoint tenha sido chamado para retornar ou manipular dados que o usuário não tem acesso.

Vamos resolver cada caso separadamente:

### 404 (rotas inválidas)

Este é provavelmente o mais simples, basta adicionar um middleware no final de tudo (mas antes do middleware de tratamento de erro) que customiza o retorno 404:

```js
app.use((_req, res) => {
  res.status(404).send({
    razao: 'Rota não existe.'
  });
});
```

### 400 (formato inválido)

Para resolver este faremos em duas partes. A primeira é tratar erros de sintaxe JSON. O middleware `json` já dispara erro nesse caso, e esse erro possui um atributo `statusCode` que passaremos a usar no nosso middleware de tratamento de erro:

```js
app.use((err, _req, res, _next) => {
  const razao = err.message || err;
  res.status(err.statusCode || 500).send({ razao });
});
```

A outra parte é falhar sempre que o corpo vier com um mime type diferente de JSON. Para isso basta adicionar um outro middleware:

```js
app.use((req, _res, next) => {
  const contentType = req.headers['content-type'];
  if (contentType !== undefined && !contentType.startsWith('application/json')) {
    next({
      statusCode: 400,
      message: 'Corpo da requisição deve ser application/json'
    });
  } else {
    next();
  }
});
```

### 422 (dados em formato válido mas conteúdo incorreto), 401 (autenticação necessária) e 403 (autenticação inválida ou acesso negado a um recurso específico)

Agora que nosso middleware de tratamento de erros suporta o atributo statusCode, podemos definir tipos de erro específicos para esses casos. Crie um arquivo `erros.js`:

```js
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
```

Use estes erros no arquivo `tarefas\model.js`:

```js
import util from 'util';

import { UsuarioNaoAutenticado } from '../erros.js';

// ...

export async function cadastrarTarefa (tarefa, loginDoUsuario) {
  if (loginDoUsuario === undefined) {
    throw new UsuarioNaoAutenticado();
  }
  await pausar(25);
  sequencial++;

// ...

export async function consultarTarefas (termo, loginDoUsuario) {
  if (loginDoUsuario === undefined) {
    throw new UsuarioNaoAutenticado();
  }
  await pausar(25);
```

E também no `usuarios\model.js`:

```js
import { v4 as uuidv4 } from 'uuid';
import util from 'util';

import { AutenticacaoInvalida, DadosOuEstadoInvalido } from '../erros.js';

// ...

export async function autenticar (login, senha) {
  await pausar(25);
  const usuario = usuarios[login];
  if (usuario === undefined || usuario.senha !== senha) {
    throw new DadosOuEstadoInvalido('CredenciaisInvalidas', 'Credenciais inválidas.');
  }
  const autenticacao = uuidv4();

// ...

export async function recuperarLoginDoUsuarioAutenticado (autenticacao) {
  await pausar(25);
  const login = autenticacoes[autenticacao];
  if (login === undefined) {
    throw new AutenticacaoInvalida();
  }
  return login;
}

// ...
```

Adapte o handler de erro de modo a dar suporte para a classe `DadosOuEstadoInvalido`:

```js
app.use((err, _req, res, _next) => {
  let resposta;
  if (err.codigo) {
    resposta = {
      codigo: err.codigo,
      descricao: err.message,
      extra: err.extra
    };
  } else {
    resposta = {
      razao: err.message || err
    };
  }
  res.status(err.statusCode || 500).send(resposta);
});
```

Note que não trocamos o `new Error` do método `isAdmin` (esse método foi escrito durante a resolução de em um dos exercícios anteriores) pois neste caso realmente representaria um defeito e não uma falha de dados de entrada do usuário, então é correto que dispare uma resposta 500.

Proposta de exercício: implemente um endpoint para retornar detalhes de uma única tarefa, ele deve responder na rota GET /tarefas/:id. Faça com que este endpoint exija autenticação. Faça também com que ele dispare erro caso o usuário logado não seja dono da tarefa (mesmo que seja admin). Lembre-se: comece do model, depois desenvolva o endpoint.

## Expondo dados do usuário logado e permitindo alterar o nome

Vamos agora implementar um endpoint que não irá exigir nenhum conhecimento novo, mas irá preparar mais o terreno para a próxima discussão: GET /usuarios/logado.

Comece adicionando o método na camada de modelo de usuários, que recupera dados do usuário a partir do login:

```js
export async function recuperarDadosDoUsuario (login) {
  if (login === undefined) {
    throw new UsuarioNaoAutenticado();
  }
  await pausar(25);
  const usuario = usuarios[login];
  if (usuario === undefined) {
    throw new Error('Usuário não encontrado.');
  }
  return {
    nome: usuario.nome
  };
}
```

E exponha o endpoint (note que em nenhum momento o login ou qualquer tipo de identificação é usado na rota):

```js
app.get('/usuarios/logado', asyncWrapper(async (req, res) => {
  const usuario = await recuperarDadosDoUsuario(req.loginDoUsuario);
  res.send(usuario);
}));
```

Proposta de exercício: implemente um endpoint que permita que o usuário logado altere seu nome. Ele deve responder na rota PUT /usuarios/logado/nome. Aceite um objeto JSON no formato `{ "nome": "Novo nome" }` ao invés de uma string (é boa prática sempre receber um objeto ou array no nível raiz de um endpoint, assim ele permanece extensível).

## Modularizando o backend usando plugins

Nota para migração Fastify: a ideia aqui é apresentar o esquema de plugins com prefixo funcionamento da mesma forma que os Express Routers.

Dê uma olhada no arquivo `app.js`. Repare que ele está crescendo a cada endpoint novo que adicionamos, o que claramente não vai ficar legal para projetos com dezenas ou centenas de endpoints. Qual seria então a melhor maneira de começar a controlar esse aumento de complexidade? A resposta do Express é o conceito de `routers`. Um router pode ser compreendido como uma mini aplicação Express (igualzinha à instância `app`), capaz de ser embutida em outros routers ou aplicações, opcionalmente vinculado a um subcaminho. Vamos aplicar o conceito de routers na nossa API de tarefas, primeiro extraindo um router para o caminho `/usuarios`. Comece criando o arquivo `usuarios/router.js`:

```js
import express from 'express';

import asyncWrapper from '../async-wrapper.js';
import { alterarNomeDoUsuario, autenticar, recuperarDadosDoUsuario } from './model.js';

const router = express.Router();

router.post('/login', asyncWrapper(async (req, res) => {
  const { login, senha } = req.body; // lembre-se do middleware express.json
  const autenticacao = await autenticar(login, senha);
  res.send({ autenticacao });
}));

router.get('/logado', asyncWrapper(async (req, res) => {
  const usuario = await recuperarDadosDoUsuario(req.loginDoUsuario);
  res.send(usuario);
}));

router.put('/logado/nome', asyncWrapper(async (req, res) => {
  await alterarNomeDoUsuario(req.body.nome, req.loginDoUsuario);
  res.sendStatus(204);
}));

export default router;
```

E adaptando o `app.js` para usar esse roteador:

```js
// ...

import usuariosRouter from './usuarios/router.js';

// ...

  res.send(tarefa);
}));

app.use('/usuarios', usuariosRouter);

app.use((_req, res) => {
  res.status(404).send({

// ...
```

Proposta de exercício: repita o processo para os endpoints que tratam tarefas. Comece criando o arquivo `tarefas/router.js`, depois adapte o `app.js`.

## Node Package Manager

Antes de prosseguir, vale discutir sobre o gestor de pacotes do Node, o NPM. Essa ferramenta controla as dependências dos seus projetos, além de permitir a instalação de ferramentas disponíveis globalmente na instalação do Node. Para exemplificar, considere a sequência de comandos para iniciar um projeto usando Angular:

```
npm install -g @angular/cli
```

Isso instala o pacote `@angular/cli` de modo global. A partir desse comando, a ferramenta `ng` ficará disponível em qualquer terminal e em qualquer diretório. Use o site `https://www.npmjs.com` para encontrar detalhes deste e qualquer outro pacote. Antes de adicionar qualquer dependência no seu projeto, é interessante analisar a "saúde" do mesmo, que é uma análise subjetiva feita sobre a quantidade de downloads, issues abertas, data do último commit no GitHub, etc.

```
ng new
```

Esse comando inicia o projeto Angular.

```
npm install @angular/material
```

Atenção: o comando seguinte vai se comportar de modo diferente no npm 7 (que acompanha o node 16). Peer dependencies são resolvidas automaticamente nesta versão do gerenciador.

Esse comando instala a dependência `@angular/material` no projeto. Repare que o comando reclama de um `peer dependency` que você precisa instalar manualmente, o `@angular/cdk`. Uma ótima leitura sobre isso pode ser vista aqui: https://stackoverflow.com/questions/26737819/why-use-peer-dependencies-in-npm-for-plugins, e aqui: https://nodejs.org/en/blog/npm/peer-dependencies/ (ver base/node_modules/define_property e define_property na árvore do Angular por exemplo). Também discutiremos sobre isso mais abaixo.

```
npm install @angular/cdk
```

Veja como fica o `package.json`:

```json
{
  "name": "?????????????",
  "version": "0.0.0",
  "scripts": {
    "ng": "ng",
    "start": "ng serve",
    "build": "ng build",
    "test": "ng test",
    "lint": "ng lint",
    "e2e": "ng e2e"
  },
  "private": true,
  "dependencies": {
    "@angular/animations": "~8.0.0",
    "@angular/cdk": "^8.0.1",
    "@angular/common": "~8.0.0",
    "@angular/compiler": "~8.0.0",
    "@angular/core": "~8.0.0",
    "@angular/forms": "~8.0.0",
    "@angular/material": "^8.0.1",
    "@angular/platform-browser": "~8.0.0",
    "@angular/platform-browser-dynamic": "~8.0.0",
    "@angular/router": "~8.0.0",
    "rxjs": "~6.4.0",
    "tslib": "^1.9.0",
    "zone.js": "~0.9.1"
  },
  "devDependencies": {
    "@angular-devkit/build-angular": "~0.800.0",
    "@angular/cli": "~8.0.2",
    "@angular/compiler-cli": "~8.0.0",
    "@angular/language-service": "~8.0.0",
    "@types/node": "~8.9.4",
    "@types/jasmine": "~3.3.8",
    "@types/jasminewd2": "~2.0.3",
    "codelyzer": "^5.0.0",
    "jasmine-core": "~3.4.0",
    "jasmine-spec-reporter": "~4.2.1",
    "karma": "~4.1.0",
    "karma-chrome-launcher": "~2.2.0",
    "karma-coverage-istanbul-reporter": "~2.0.1",
    "karma-jasmine": "~2.0.1",
    "karma-jasmine-html-reporter": "^1.4.0",
    "protractor": "~5.4.0",
    "ts-node": "~7.0.0",
    "tslint": "~5.15.0",
    "typescript": "~3.4.3"
  }
}
```

O que são os `scripts`? São utilitários que você deseja deixar documentado no próprio projeto, acessíveis através do comando `npm run <script>`, ex: `npm run start`. Alguns desses scripts podem ser chamados sem o uso do comando `run`, como `start`: `npm start`.

As `dependencies` são todas as bibliotecas usadas diretamente pelo seu projeto. Elas são instaladas no diretório `node_modules` (esse diretório *não* deve ser versionado no repositório do projeto). Sempre que uma cópia limpa do projeto for criada, basta executar o comando `npm install` para baixar novamente todas as dependências.

As `devDependencies` são normalmente ferramentas usadas no ambiente de desenvolvimento, mas que não são necessárias para usar uma biblioteca ou rodar o projeto em um ambiente.

Execute o comando abaixo para analisar o gráfico de dependências do projeto:

```
npm ls
```

Sim, praticamente a Internet toda. Para ter uma saída um pouco mais legível, limite o nível de folhas:

```
npm ls --depth=0
```

## Semantic Versioning (SemVer)

Dê uma olhada nas dependências do projeto usado para testes na seção anterior. O que significam, exatamente, as definições de versão nas dependências? Por exemplo:

```
"@angular/cli": "~8.0.2"
```

Todo pacote Node que é publicado em um repositório (como o npmjs.com, por exemplo) precisa ter um nome e uma versão. Essa versão precisa ser compatível com o conceito de versão semântica (SemVer [1][2]). De forma resumida, versionamento semântico é composto por três números:

```
1.2.3
```

O primeiro é a versão `MAJOR`. O segundo, a `MINOR`, e o terceiro, `PATCH`. A versão `MAJOR` só deve mudar quando a biblioteca alterar sua *interface externa* de modo *incompatível* com as versões anteriores, por exemplo: alteração de assinatura de método de modo que chamadas existentes deixem de funcionar, remoção completa de um método. A `MINOR` é incrementada quando houver *adição de funcionalidade*, sem quebrar código existente. Por fim, a versão `PATCH` só é incrementada quando existirem apenas correções de bugs, melhorias de performance e coisas do tipo em funcionalidades existentes.

Com isso, é possível dizer para o NPM quais versões de determinada biblioteca você entende que seu projeto suporta. A maneira mais engessada seria dizer *exatamente* qual versão usar, por exemplo:

```
"@angular/cli": "8.0.2"
```

Neste caso, não importa quantas novas versões da biblioteca já foram publicadas, esse projeto sempre vai usar a versão `8.0.2`. Uma outra forma é permitir que o npm baixe versões `PATCH` mais novas automaticamente. Isso pode ser atingido de diversas formas:

```
"@angular/cli": "8.0"
"@angular/cli": "8.0.x"
"@angular/cli": "8.0.X"
"@angular/cli": "8.0.*"
"@angular/cli": "~8.0.2"
"@angular/cli": ">=8.0.2 <8.1"
"@angular/cli": "8.0.2 - 8.0"
```

Note que as 4 primeiras opções vão aceitar a versão `8.0.1` se esta estiver disponível, enquanto as 3 últimas são um pouco mais restritivas.

De modo similar, você pode ser ainda mais flexível, e aceitar incrementos `MINOR` de forma automática:

```
"@angular/cli": "~8"
"@angular/cli": "8.x"
"@angular/cli": "8"
"@angular/cli": ">=8.0.2 <9"
"@angular/cli": ">=8.0.2 - 8"
"@angular/cli": "^8.0.2"
```

E se estiver se sentindo aventureiro, pode até mesmo aceitar qualquer versão da biblioteca:

```
"@angular/cli": "*"
```

[1] https://semver.org/

[2] https://docs.npmjs.com/misc/semver

## Documentação da API

Toda API precisa de documentação, em diferentes níveis dependendo da forma como é utilizada, mas precisa. Mas o que é uma documentação de API? Normalmente é um simples portal onde o desenvolvedor consegue obter detalhes sobre cada endpoint, parâmetros de entrada, saídas possíveis, e também detalhes do mecanismo de autenticação.

A especificação Swagger surgiu em 2011 como uma maneira de documentar APIs. Existem várias maneiras de abordar essa documentação, cada uma com seus prós e contras. Em uma ponta do espectro temos a escrita da especificação de modo manual e totalmente separado da implementação, enquanto na outra ponta temos software que gera a especificação a partir do código-fonte da API, com ou sem o apoio de "anotações" no próprio código.

Como é muito mais fácil entender o funcionamento de uma ferramenta geradora de documentação após ter tido a experiência de escrevê-la manualmente, é assim que faremos aqui.

Atualmente existe um formato aberto, desvinculado da empresa Swagger, chamado OpenAPI. Ele é fortemente baseado na especificação Swagger, por isso na prática o conhecimento adquirido vale para os dois. Existe uma ferramenta chamada [Swagger Editor](https://editor.swagger.io/), que utilizaremos para escrever nossa documentação.

Comece com um único atributo definindo a versão da especificação:

```yaml
openapi: 3.0.1
```

Note que o editor comeca a ajudar indicando as coisas que estão faltando. Adicione detalhes básicos de identificação e um objeto vazio de caminhos.

```yaml
openapi: 3.0.1
info:
  title: Tarefas
  version: 1.0.0
paths: {}
```

Essa é a versão mínima de uma especificação, note que o editor começa a mostrar do lado direito uma espécie de portal. Vamos adicionar um servidor para indicar para o utilizador onde ele pode encontrar a API:

```yaml
servers:
  - url: http://localhost:8080
```

Próximo passo é especificar como funciona a autenticação na API. Isso ocorre definindo um esquema de segurança e depois aplicando ele globalmente:

```yaml
openapi: 3.0.1
info:
  title: Tarefas
  version: 1.0.0
servers:
  - url: http://localhost:8080
paths: {}
components:
  securitySchemes:
    token: 
      type: http
      scheme: bearer
      bearerFormat: uuid
security:
  - token: []
```

Agora que os acessórios estão especificados podemos começar a especificar os endpoints, começando pelo endpoint de login:

```yaml
paths:
  /usuarios/login:
    post:
      summary: Autenticar usuário.
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                login:
                  type: string
                senha:
                  type: string
              required: [ 'login', 'senha' ]
      responses:
        200:
          description: Autenticado com sucesso.
          content:
            application/json:
              schema:
                type: object
                properties:
                  token:
                    type: string
                    format: uuid
                required: [ 'token' ]
```

E os possíveis erros? Neste caso vale a pena adotar uma estratégia de reutilização. Especificamos uma vez e reusamos em todos os endpoints. Veja:

```yaml
# ...
paths:
  /usuarios/login:
    post:
      summary: Autenticar usuário.
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                login:
                  type: string
                senha:
                  type: string
              required: [ 'login', 'senha' ]
      responses:
        200:
          description: Autenticado com sucesso.
          content:
            application/json:
              schema:
                type: object
                properties:
                  token:
                    type: string
                    format: uuid
                required: [ 'token' ]
        400:
          $ref: '#/components/responses/RequisicaoInvalida'
        422:
          $ref: '#/components/responses/DadosDaRequisicaoInvalidos'
        500:
          $ref: '#/components/responses/BugOuServidorIndisponivel'
# ...
components:
  responses:
    RequisicaoInvalida:
      description: O formato não foi reconhecido.
      content:
        application/json:
          schema:
            type: object
            properties:
              razao:
                type: string
            required: [ 'razao' ]
    DadosDaRequisicaoInvalidos:
      description: O formato está ok mas os dados não.
      content:
        application/json:
          schema:
            type: object
            properties:
              codigo:
                type: string
              descricao:
                type: string
            required: [ 'codigo', 'descricao' ]
    NaoAutenticado:
      description: Você deve incluir um token de autenticação para efetuar essa chamada.
    NaoAutorizadoOuTokenInvalido:
      description: Seu token de autenticação é inválido, expirou ou você está autenticado mas não possui acesso ao recurso solicitado.
      content:
        application/json:
          schema:
            type: object
            properties:
              tipo:
                type: string
                enum: [ 'NaoAutorizado', 'TokenInvalido' ]
            required:
            - tipo
    TokenInvalido:
      description: Seu token de autenticação é inválido ou expirou.
      content:
        application/json:
          schema:
            type: object
            properties:
              tipo:
                type: string
                enum: [ 'TokenInvalido' ]
            required:
            - tipo
    BugOuServidorIndisponivel:
      description: Ocorreu um erro no servidor ou ele encontra-se indisponível.
  securitySchemes:
# ...
```

Vamos agora especificar o GET /tarefas:

```yaml
# ...
  /tarefas:
    get:
      summary: Carregar tarefas do usuário logado.
      parameters:
        - name: termo
          in: query
          schema:
            type: string
      responses:
        200:
          description: Lista de tarefas.
          content:
            application/json:
              schema:
                type: array
                items:
                  type: object
                  properties:
                    descricao:
                      type: string
                  required: [ 'descricao' ]
        400:
          $ref: '#/components/responses/RequisicaoInvalida'
        401:
          $ref: '#/components/responses/NaoAutenticado'
        403:
          $ref: '#/components/responses/TokenInvalido'
        500:
          $ref: '#/components/responses/BugOuServidorIndisponivel'
# ...
```

Proposta de exercício: documente os seguintes endpoints:

- POST /tarefas
- GET /usuarios/logado
- PUT /usuarios/logado/nome

## Validação de dados de entrada

Repare que até o momento não nos preocupamos com o formato do objeto JSON que vem na requisição. Simplesmente pegamos o objeto e entregamos para o armazenamento. Na melhor das hipóteses esse tipo de codificação gera inconsistência de dados, e na pior pode ser uma gravíssima falha de segurança (imagine um cadastro de usuário que "sem querer" permite definir o valor inicial do campo `admin`).

O ideal é que todo tipo de entrada de dado seja verificado antes de executar qualquer tipo de operação de negócio.

Uma maneira de executar essas validações seria, no próprio endpoint, implementar uma cadeia de condicionais e afins. Por mais que seja funcional, é uma maneira bem verbosa e improdutiva de desenvolver esse tipo de checagem.

Uma outra forma, especialmente útil em Node.js pois já estamos trabalhando com JSON, é o uso de [JSON Schema](https://json-schema.org/) (fizemos isso já na seção anterior, definindo o schema de entrada da API). A abordagem se resume a:

- Instalar uma ferramenta que permita validar um objeto JSON baseado em uma definição de JSON Schema;
- Declarar o schema;
- Chamar o método que valida o objeto, passando o schema, e deixar os erros gerarem um retorno 422 conforme especificado por nós (isso pode variar em outras APIs).

Vamos começar instalando o pacote `ajv` (um dos validadores de esquema disponíveis para Node.js). Lembre-se de executar o comando abaixo na pasta da API de tarefas:

```sh
$ npm install ajv
```

Agora vá até o roteador de usuários `usuarios/router.js`, defina o schema do endpoint de login e aplique a validação:

```js
import express from 'express';
import Ajv from 'ajv';

// ...

const router = express.Router();
const ajv = new Ajv();

const loginSchema = {
  type: 'object',
  properties: {
    login: { type: 'string' },
    senha: { type: 'string' }
  },
  required: [ 'login', 'senha' ]
};
const loginSchemaValidator = ajv.compile(loginSchema);

router.post('/login', asyncWrapper(async (req, res) => {
  if (!loginSchemaValidator(req.body)) {
    throw new DadosOuEstadoInvalido('FalhouValidacaoEsquema', ajv.errorsText(loginSchemaValidator.errors), loginSchemaValidator.errors);
  }
  const { login, senha } = req.body; // lembre-se do middleware express.json
  const autenticacao = await autenticar(login, senha);
  res.send({ autenticacao });
}));

// ...
```

Tente passar uma propriedade extra na requisição. Repare que o ajv não vai reclamar. Isso pode ou não ser desejado, mas a boa prática é rejeitar esse tipo de chamada ou no mínimo remover quaisquer atributos adicionais. Para rejeitar entradas lembre-se de definir `additionalProperties: false` em todos os schemas do tipo `object`:

```js
const loginSchema = {
  type: 'object',
  properties: {
    login: { type: 'string' },
    senha: { type: 'string' }
  },
  required: [ 'login', 'senha' ],
  additionalProperties: false
};
```

Para remover propriedades adicionais de todos os objetos validados, use a configuração `removeAdditional` no objeto de configuração do ajv:

```js
new Ajv({ removeAdditional: true });
```

Como consumidor eu prefiro receber um erro, como fornecedor eu prefiro a opção global que evita falha humana e brechas de segurança. Esse é um dos casos em que é difícil escolher a melhor opção.

Remova agora os dois campos e execute, note que o ajv parou no primeiro erro. Isso é bom pensando em performance, mas é bem ruim para o consumidor da sua API (principalmente se ele estiver atualizando o frontend com base nesse detalhamento do erro). Existe uma outra configuração do ajv que muda esse comportamento, validando sempre todo o objeto:

```js
new Ajv({
  removeAdditional: true,
  allErrors: true
});
```

Proposta de exercício: aplique validação de entrada nos outros endpoints POST e PUT:

- POST /tarefas
- PUT /usuarios/logado/nome

## Extraindo um middleware validador de entrada

Você deve ter notado o quão repetitivo o código de validação se tornou. A única coisa que muda de fato é o schema, mas temos que colocar uma série de código em todos os routers e endpoints mesmo assim. Felizmente é possível extrair um Middleware que simplifica muito, de uma forma bem parecida com o que fizemos no `asyncWrapper`. Comece criando um arquivo `schema-validator.js`:

```js
import Ajv from 'ajv';

import { DadosOuEstadoInvalido } from './erros.js';

const ajv = new Ajv({
  removeAdditional: true,
  allErrors: true
});

export default schema => {
  const validator = ajv.compile(schema);
  return (req, _res, next) => {
    if (!validator(req.body)) {
      const errors = validator.errors;
      throw new DadosOuEstadoInvalido('FalhouValidacaoEsquema', ajv.errorsText(errors), errors);
    }
    next();
  };
};
```

E use-o no `usuarios/router.js`:

```js
import express from 'express';

import asyncWrapper from '../async-wrapper.js';
import schemaValidator from '../schema-validator.js';
import { DadosOuEstadoInvalido } from '../erros.js';
import { alterarNomeDoUsuario, autenticar, recuperarDadosDoUsuario } from './model.js';

const router = express.Router();

const loginSchema = {
  type: 'object',
  properties: {
    login: { type: 'string' },
    senha: { type: 'string' }
  },
  required: [ 'login', 'senha' ]
};

router.post('/login', schemaValidator(loginSchema), asyncWrapper(async (req, res) => {
  const { login, senha } = req.body; // lembre-se do middleware express.json
  const autenticacao = await autenticar(login, senha);
  res.send({ autenticacao });
}));

// ...

const nomeSchema = {
  type: 'object',
  properties: {
    nome: { type: 'string' }
  },
  required: [ 'nome' ]
};

router.put('/logado/nome', schemaValidator(nomeSchema), asyncWrapper(async (req, res) => {
  await alterarNomeDoUsuario(req.body.nome, req.loginDoUsuario);
  res.sendStatus(204);
}));

export default router;
```

Proposta de exercício: aplique o middleware `schemaValidator` no roteador de tarefas.

## Concluindo e reabrindo tarefas

Uma das funcionalidades que queremos oferecer na nossa API de tarefas é a conclusão e reabertura das tarefas. Temos algumas possibilidades aqui:

1. `PATCH /tarefas/:id { "concluida": true }`
2. `POST /tarefas/:id/concluir`

Qual dessas parece mais adequada? A primeira é uma maneira mais RESTful, com certeza, enquanto a segunda (com estilo RPC) é mais flexível. Cada equipe terá sua preferência e esse também é um ponto que sempre rende discussões (nem todas saudáveis). Independente do caminho seguido, é importante garantir que haja uma padronização de estilo em toda a API e que as chamadas sejam idempotentes (evitar por exemplo retornar um erro caso a tarefa já esteja concluída, note que isso é mais intuitivo na opção 1 do que na 2). Um dos problemas da opção 1 é que ela passa a falsa impressão de que concluída precisa ser um atributo no banco de dados, o que não é verdade (podemos armazenar a data da conclusão ao invés de um boolean, por exemplo).

Nesta disciplina nós vamos misturar RPC com RESTful, dando preferência para RESTful sempre que possível (nunca adotaremos `POST /tarefas/consultar`, por exemplo).

Vamos então desenvolver a opção 2. Comece adaptando o arquivo `tarefas/model.js`:

```js
// ...

let sequencial = 3;
const tarefas = [
  {
    id: 1,
    loginDoUsuario: 'pedro',
    descricao: 'Comprar leite',
    dataDeConclusao: null
  },
  {
    id: 2,
    loginDoUsuario: 'pedro',
    descricao: 'Trocar lâmpada',
    dataDeConclusao: new Date()
  },
  {
    id: 3,
    loginDoUsuario: 'clara',
    descricao: 'Instalar torneira',
    dataDeConclusao: null
  }
];

export async function cadastrarTarefa (tarefa, loginDoUsuario) {
  // ...
  sequencial++;
  tarefas.push({
    id: sequencial,
    loginDoUsuario,
    dataDeConclusao: null,
    ...tarefa
  });
  return sequencial;
}

export async function consultarTarefas (termo, loginDoUsuario) {
  // ...
    tarefasDisponiveis = tarefasDisponiveis
      .filter(x => x["descricao"].toLowerCase().indexOf(termo.toLowerCase()) >= 0);
  }
  return tarefasDisponiveis.map(x => ({
    id: x.id,
    descricao: x.descricao,
    concluida: !!x.dataDeConclusao
  }));
}

// ...

export async function buscarTarefa (id, loginDoUsuario) {
  // ...
    throw new AcessoNegado();
  }
  return {
    descricao: tarefa.descricao,
    concluida: !!tarefa.dataDeConclusao
  };
}

export async function concluirTarefa (id, loginDoUsuario) {
  if (loginDoUsuario === undefined) {
    throw new UsuarioNaoAutenticado();
  }
  await pausar(25);
  const tarefa = tarefas.find(x => x['id'] === parseInt(id));
  if (tarefa === undefined) {
    throw new DadosOuEstadoInvalido('TarefaNaoEncontrada', 'Tarefa não encontrada.');
  }
  if (tarefa['loginDoUsuario'] !== loginDoUsuario) {
    throw new AcessoNegado();
  }
  if (tarefa.dataDeConclusao === null) {
    tarefa.dataDeConclusao = new Date(); // expor um boolean não significa que temos que armazenar um, checkmate scaffolders.
  } // sem else para garantir idempotência
}
```

E agora exponha o endpoint no roteador `tarefas/router.js`:

```js
router.post('/:id/concluir', asyncWrapper(async (req, res) => {
  await concluirTarefa(req.params.id, req.loginDoUsuario);
  res.sendStatus(204);
}));
```

Proposta de exercício: implemente o endpoint POST /tarefas/:id/reabrir. Lembre-se da idempotência, e do fato de reabrir significar nada mais que atribuir `null` para `dataDeConclusao`. O que acontece com o histórico? Um bom momento para discutir Event Sourcing.
