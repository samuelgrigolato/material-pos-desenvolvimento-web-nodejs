# Testes automatizados

Hoje em dia não se considera mais como boa prática a manutenção/desenvolvimento de bases de código sem a escrita de testes automatizados. Os benefícios trazidos por uma boa cobertura são muito grandes, desde o valor de documentação providenciado pelo código de teste até o aumento na confiança nas implantações.

Mas como funciona o desenvolvimento de automação de testes? Isso depende muito do tipo de teste e da plataforma de desenvolvimento utilizada. Nesta disciplina exploraremos o desenvolvimento de testes unitários e de integração, mas também existem outros como o teste de aceitação.

Existem três grandes frameworks de teste para JavaScript: Mocha, Jest e Jasmine. Aqui utilizaremos o Jest, mas a estrutura é parecida nos três. Ele pode ser instalado via npm:

```sh
$ npm install --save-dev jest
```

Mas instalar o Jest não é suficiente, pois estamos utilizando TypeScript no projeto. Uma opção para esta combinação seria sempre transpilar o código rodando o comando `tsc`, e executar os testes da pasta `build`. Essa é uma solução simples que funciona bem para projetos cujo tempo total de compilação não é muito longo. Existe uma abordagem utilizando Babel, que não descreveremos nem utilizaremos no curso, e uma terceira, usando o `ts-node`, que já vimos durante a escrita de migrações `knex`. Existe um pacote, baseado no `ts-node`, que faz a ponte do Jest para ele, chamado `ts-jest`. Vamos instalá-lo:

```commandline
$ npm install --save-dev ts-jest
$ npm install --save-dev @types/jest
```

O terceiro passo necessário é explicar para o executável `jest` que ele deve usar o `ts-jest`, e que deve ignorar arquivos na pasta `build` do projeto. Isso é feito no arquivo de configuração `jest.config.js`, que pode ser criado pelo próprio `ts-jest` através do seguinte comando:

```commandline
$ npx ts-jest config:init
```

Edite agora o arquivo `jest.config.js`, adicionando a propriedade `testPathIgnorePatterns`, dessa forma:

```js
/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testPathIgnorePatterns: ['/node_modules/', '/build/'],
};
```

Agora estamos prontos para escrever nosso primeiro teste. Antes de começar a adicionar cobertura no código do Tafeito, vamos explorar um hipotécico módulo que calcula o enésimo número de fibonacci, assim podemos focar no Jest em si. Crie um arquivo chamado `fib/fib.ts` com o seguinte conteúdo:

```ts
export default (n: number) => 0;
```

E agora um outro arquivo chamado `fib/fib.test.ts`:

```ts
import fib from './fib';

describe('fib', () => {

  it('should return 1 when n is 1', () => {
    expect(fib(1)).toBe(1);
  });

});
```

Para executar utilize o seguinte comando:

```sh
npx jest
```

Lembra da seção de scripts do `package.json`? Agora é uma boa hora para adicionar um atalho para executar os testes do projeto:

```json
{
  // ...
  "scripts": {
    "build": "rm -rf build && tsc -p tsconfig.json",
    "start": "cd build && JWT_SECRET=123456 node app.js",
    "test": "jest"
  }
  // ...
}
```

Agora basta usar o comando `npm t` para rodar os testes.

Vamos "fazer os testes passarem" da maneira mais simples possível, que no caso é simplesmente alterar o retorno para 1. Obviamente ainda não temos uma função capaz de gerar os números de fibonacci, então vamos adicionar mais alguns testes (esse processo de desenvolvimento é chamado de Test-Driven Development, ou TDD):

```ts
import fib from './fib';

describe('fib', () => {

  it('should return 1 when n is 1', () => {
    expect(fib(1)).toBe(1);
  });

  it('should return 1 when n is 2', () => {
    expect(fib(2)).toBe(1);
  });

  it('should return 2 when n is 3', () => {
    expect(fib(3)).toBe(2);
  });

  it('should return 3 when n is 4', () => {
    expect(fib(4)).toBe(3);
  });

  it('should return 5 when n is 5', () => {
    expect(fib(5)).toBe(5);
  });

  it('should return 8 when n is 6', () => {
    expect(fib(6)).toBe(8);
  });

});
```

E implementar a solução final:

```ts
const fib = (n: number): number => {
  if (n <= 2) {
    return 1;
  }
  return fib(n - 1) + fib(n - 2);
};

export default fib;
```

Agora que sabemos como é a estrutura de um teste automatizado podemos aplicá-lo na API de tarefas. Vamos começar com uma cobertura de teste *unitário*, ou seja, um teste que exercita um bloco sem nenhuma dependência, seja do próprio repositório ou serviços/APIs externas, como banco de dados. Existem várias estratégias para viabilizar testes unitários, como injeção de dependências, patching/mocking etc.

Vamos analisar o método `estimar` do módulo de tarefas. Veja como é mais simples passar uma implementação "mocada" (alternativa) do conceito de chatbot, em comparação com o `uow`. Isso ocorre pois fizemos um bom trabalho ao manter os detalhes de implementação do chatbot OpenAI afastados do módulo de domínio para tarefas. Comece criando um arquivo `tarefas/model.test.ts`:

```ts
import { Chatbot } from '../chatbot/api';
import { Usuario } from '../usuarios/model';
import { estimar } from './model';


describe('tarefas/model', () => {

  describe('#estimar', () => {

    it('deve retornar a estimativa no caso feliz', async () => {
      const usuario: Usuario = {
        id: 1,
        nome: 'Fulano',
        senha: '???',
        admin: false,
        login: 'fulano',
      };
      const idTarefa = 1;
      const tarefa = {
        id_usuario: 1,
        descricao: 'Tarefa X',
      }

      const uow = () => ({
        select: () => ({
          where: () => ({
            first: () => Promise.resolve(tarefa),
          })
        })
      });

      const chatbot: Chatbot = {
        perguntarFraseUnica: () => { throw new Error('Não deveria ter chamado') },
        perguntarListaDeFrases: () => { throw new Error('Não deveria ter chamado') },
        perguntarDuracaoDeTempo: async () => {
          return { horas: 1, minutos: 2 };
        }
      };

      const estimativa = await estimar(usuario, idTarefa, uow as any, chatbot);

      expect(estimativa).toEqual({ horas: 1, minutos: 2 });
    });

  });

});
```

Vamos agora adicionar mais um caso de teste, agora para cobrir o cenário onde o usuário não é o dono da tarefa:

```ts
it('deve retornar erro se o usuário não for o dono da tarefa', async () => {
  const usuario: Usuario = {
    id: 2,
    nome: 'Hackerman',
    senha: '???',
    admin: false,
    login: 'hackerman',
  };
  const idTarefa = 1;
  const tarefa = {
    id_usuario: 1,
    descricao: 'Tarefa X',
  }

  const uow = () => ({
    select: () => ({
      where: () => ({
        first: () => Promise.resolve(tarefa),
      })
    })
  });

  await expect(estimar(usuario, idTarefa, uow as any, null as any))
    .rejects.toThrowError('Acesso ao recurso solicitado foi negado');
});
```

[Exercício 01_tarefa_inexistente](exercicios/01_tarefa_inexistente/README.md)



1. No arquivo de modelo;
2. Interagindo direto com o `app` Express.

Quanto mais "alto" o ponto de corte, ou seja, quanto mais próximo da chamada HTTP, mais abrangente é o teste. Porém, além de abrangente o teste costuma ser mais complicado de escrever e viabilizar.

Vamos começar pelo teste no arquivo de modelo. Faremos no método que permite cadastrar uma etiqueta em uma tarefa, e trataremos os cenários onde a etiqueta já existe e não existe previamente. Veja a assinatura do método, para relembrar:

```js
export async function vincularEtiqueta (idTarefa, etiqueta, loginDoUsuario, uow) {
```

Note que este método (e praticamente todos os outros) vai efetuar muitos acessos na base de dados. Poderíamos "simular" uma base de dados, o que de fato vamos fazer em outro momento, mas nesse caso queremos utilizar uma base de dados real, para aumentar nossa confiança de que não escreveremos migrações de banco de dados que sem querer quebram partes da nossa API. Para atingir este objetivo temos duas coisas a fazer:

1. Adaptar o arquivo `querybuilder.js` e o `knexfile.js` para olhar as variáveis de ambiente na hora de definir a string de conexão com o banco de dados;
2. Escrever um script utilitário para rodar os testes que, antes de rodá-los, executa as migrações.

Para o primeiro passo, ajuste o arquivo `querybuilder.js` dessa forma:

```js
const knex = knexLib({
  client: 'pg',
  connection: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/postgres',
  debug: true
});
```

E, similarmente, o `knexfile.js`:

```js
export const development = {
  client: 'postgresql',
  connection: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/postgres',
  migrations: {
    tableName: 'knex_migrations'
  }
};
```

Crie agora um arquivo `rodar_testes.sh`:

```sh
#!/bin/bash

set -e

export DATABASE_URL='postgres://postgres:postgres@localhost:5432/testes'
npx knex --esm migrate:latest
NODE_OPTIONS=--experimental-vm-modules npx jest
```

Crie o banco de dados `testes` no PostgreSQL.

Dê permissão de execução para este arquivo e execute-o:

```sh
$ chmod +x rodar_testes.sh
$ ./rodar_testes.sh
```

Agora que temos o banco de dados "limpo" disponível nos testes, crie um arquivo chamado `tarefas/model.test.js` com o seguinte conteúdo:

```js
describe('vincularEtiqueta', () => {
  it('deve cadastrar a etiqueta se ela ainda não existir', async () => {
    let trx = await db.transaction();
    try {
      let res = await trx('usuarios')
        .insert({
          login: 'fulano',
          nome: 'Fulano',
          senha: '???'
        })
        .returning('id');
      const idUsuario = res[0];
      res = await trx('categorias')
        .insert({ descricao: 'Pessoal' })
        .returning('id');
      const idCategoria = res[0];
      res = await trx('tarefas')
        .insert({
          descricao: 'Tarefa X',
          id_usuario: idUsuario,
          id_categoria: idCategoria
        })
        .returning('id');
      const idTarefa = res[0];
      await vincularEtiqueta(idTarefa, 'youtube', 'fulano', trx);
      res = await trx('etiquetas')
        .select(['id', 'descricao']);
      expect(res.length).toBe(1);
      expect(res[0].descricao).toBe('youtube');
      const idEtiqueta = res[0].id;
      res = await trx('tarefa_etiqueta')
        .select(['id_tarefa', 'id_etiqueta']);
      expect(res.length).toBe(1);
      expect(res[0].id_tarefa).toBe(idTarefa);
      expect(res[0].id_etiqueta).toBe(idEtiqueta);
    } finally {
      await trx.rollback();
    }
  });
});
```

Antes de refatorarmos este código, note que o jest não encerra de fato. Isso ocorre pois o knex ainda está com suas conexões abertas. Para encerrá-lo crie um arquivo chamado `jest.config.js` com o seguinte conteúdo:

```js
export default {
  setupFilesAfterEnv: [
    './setupTest.js'
  ]
};
```

Agora crie o arquivo `setupTest.js`:

```js
import db from './querybuilder';

afterAll(async () => {
  await db.destroy();
});
```

Antes de continuar podemos implementar algumas refatorações no código de teste. A primeira delas é a criação de um utilizário `comTransacaoDeTeste` que encapsula a criação da transação e seu rollback. Crie um arquivo `testes/transacao-de-teste.js`:

```js
import db from '../querybuilder';

export default (callback) => {
  return async () => {
    let trx = await db.transaction();
    try {
      await callback(trx);
    } finally {
      await trx.rollback();
    }
  }
};
```

E use-o no arquivo `model.test.js`:

```js
it('deve cadastrar a etiqueta se ela ainda não existir', comTransacaoDeTeste(async (trx) => {
  let res = await trx('usuarios')
    .insert({
      login: 'fulano',
      nome: 'Fulano',
      senha: '???'
    })
    .returning('id');
  //...
  res = await trx('tarefa_etiqueta')
    .select(['id_tarefa', 'id_etiqueta']);
  expect(res.length).toBe(1);
  expect(res[0].id_tarefa).toBe(idTarefa);
  expect(res[0].id_etiqueta).toBe(idEtiqueta);
}));
```

A próxima refatoração é extrair a criação dos registros para funções reutilizáveis. Essas funções são comumente chamadas de "fábricas". Crie um arquivo `testes/fabrica.js` com o seguinte conteúdo:

```js
export async function fabricarCategoria (trx) {
  const res = await trx('categorias')
    .insert({ descricao: 'Categoria Teste' })
    .returning('id');
  return res[0];
}

export async function fabricarUsuario (trx, { login } = {}) {
  const res = await trx('usuarios')
    .insert({
      nome: 'Usuário Teste',
      login: login || 'usuario',
      senha: '123456'
    })
    .returning('id');
  return res[0];
}

export async function fabricarTarefa (trx, { id_usuario, id_categoria }) {
  const res = await trx('tarefas')
    .insert({
      descricao: 'Tarefa Teste',
      id_usuario,
      id_categoria
    })
    .returning('id');
  return res[0];
}
```

E use esses métodos no `model.test.js`:

```js
import comTransacaoDeTeste from '../testes/transacao-de-teste';
import { fabricarCategoria, fabricarTarefa, fabricarUsuario } from '../testes/fabrica';
import { vincularEtiqueta } from './model';

describe('vincularEtiqueta', () => {
  it('deve cadastrar a etiqueta se ela ainda não existir', comTransacaoDeTeste(async (trx) => {
    const idUsuario = await fabricarUsuario(trx, { login: 'fulano' });
    const idCategoria = await fabricarCategoria(trx);
    const idTarefa = await fabricarTarefa(trx, { id_usuario: idUsuario, id_categoria: idCategoria });
    await vincularEtiqueta(idTarefa, 'youtube', 'fulano', trx);
    res = await trx('etiquetas')
      .select(['id', 'descricao']);
    expect(res.length).toBe(1);
    expect(res[0].descricao).toBe('youtube');
    const idEtiqueta = res[0].id;
    res = await trx('tarefa_etiqueta')
      .select(['id_tarefa', 'id_etiqueta']);
    expect(res.length).toBe(1);
    expect(res[0].id_tarefa).toBe(idTarefa);
    expect(res[0].id_etiqueta).toBe(idEtiqueta);
  }));
});

export default {};
```

Node que idCategoria serve apenas para criar a tarefa, então faz sentido mover esta criação para dentro do método `fabricarTarefa`:

```js
export async function fabricarTarefa (trx, { idUsuario, idCategoria }) {
  const res = await trx('tarefas')
    .insert({
      descricao: 'Tarefa Teste',
      id_usuario: idUsuario,
      id_categoria: idCategoria || await fabricarCategoria(trx)
    })
    .returning('id');
  return res[0];
}
```

E adaptar mais uma vez o `model.test.js`:

```js
import comTransacaoDeTeste from '../testes/transacao-de-teste';
import { fabricarTarefa, fabricarUsuario } from '../testes/fabrica';
import { vincularEtiqueta } from './model';

describe('vincularEtiqueta', () => {
  it('deve cadastrar a etiqueta se ela ainda não existir', comTransacaoDeTeste(async (trx) => {
    const idUsuario = await fabricarUsuario(trx, { login: 'fulano' });
    const idTarefa = await fabricarTarefa(trx, { idUsuario });
    await vincularEtiqueta(idTarefa, 'youtube', 'fulano', trx);
    let res = await trx('etiquetas')
      .select(['id', 'descricao']);
    expect(res.length).toBe(1);
    expect(res[0].descricao).toBe('youtube');
    const idEtiqueta = res[0].id;
    res = await trx('tarefa_etiqueta')
      .select(['id_tarefa', 'id_etiqueta']);
    expect(res.length).toBe(1);
    expect(res[0].id_tarefa).toBe(idTarefa);
    expect(res[0].id_etiqueta).toBe(idEtiqueta);
  }));
});

export default {};
```

Proposta de exercício: crie um caso de teste que garante que o vínculo de uma etiqueta existente funciona sem quebrar a aplicação.

Comece criando uma fábrica para etiquetas no arquivo `testes/fabrica.js`:

```js
export async function fabricarEtiqueta (trx, { descricao, cor } = {}) {
  const res = await trx('etiquetas')
    .insert({
      descricao: descricao || 'Etiqueta Teste',
      cor: cor || 'white'
    })
    .returning('id');
  return res[0];
}
```

E depois adicione um novo bloco `it` no arquivo `model.test.js`:

```js
it('deve funcionar se a etiqueta já existir', comTransacaoDeTeste(async (trx) => {
  const idUsuario = await fabricarUsuario(trx, { login: 'fulano' });
  const idTarefa = await fabricarTarefa(trx, { idUsuario });
  const idEtiqueta = await fabricarEtiqueta(trx, { descricao: 'youtube' });
  await vincularEtiqueta(idTarefa, 'youtube', 'fulano', trx);
  const res = await trx('tarefa_etiqueta')
    .select(['id_tarefa', 'id_etiqueta']);
  expect(res.length).toBe(1);
  expect(res[0].id_tarefa).toBe(idTarefa);
  expect(res[0].id_etiqueta).toBe(idEtiqueta);
}));
```

Agora vamos subir um nível e implementar esses mesmos testes conversando direto com o Express. Para isso utilizaremos uma biblioteca chamada `supertest`. Instale-a:

```sh
$ npm i supertest
```

Possivelmente agora você irá se lembrar que a unidade de trabalho é um Middleware no Express. De alguma forma teremos que interceptá-lo para injetar a transação de teste, e isso será feito da seguinte forma:

1. Extrair o código que adiciona os middlewares e routers na instância de app em um arquivo `setup-app.js`;
2. Chamar esse método no arquivo `app.js`;
3. Criar um utilitário `testes/app-de-teste.js` que monta uma instância de app adicionando um middleware que expõe uma transação de teste;
4. Adaptar o hook `comUnidadeDeTrabalho` para não sobrescrever `req.uow` caso já exista.

Primeiro passo, crie o arquivo `setup-app.js` e mova uma parte do conteúdo que está em `app.js`:

```js
import express from 'express';
import cors from 'cors';
import fileUpload from 'express-fileupload';

import asyncWrapper from './async-wrapper.js';
import { recuperarLoginDoUsuarioAutenticado } from './usuarios/model.js';
import usuariosRouter from './usuarios/router.js';
import tarefasRouter from './tarefas/router.js';
import etiquetasRouter from './etiquetas/router.js';
import categoriasRouter from './categorias/router.js';

export default app => {
  app.use(cors());
  app.use(express.json());
  app.use(fileUpload({
    debug: true,
    //useTempFiles: false,
    //abortOnLimit: false,
    limits: {
      fileSize: 50 * 1024 * 1024 // 50mb
    }
  }));
  
  app.use((req, _res, next) => {
    const contentType = req.headers['content-type'];
    if (contentType !== undefined &&
        !contentType.startsWith('application/json') &&
        !contentType.startsWith('multipart/form-data')) {
      next({
        statusCode: 400,
        message: 'Corpo da requisição deve ser application/json ou multipart/form-data'
      });
    } else {
      next();
    }
  });
  
  app.use(asyncWrapper(async (req, _res, next) => {
    const authorization = req.headers['authorization'];
    const match = /^Bearer (.*)$/.exec(authorization);
    if (match) {
      const autenticacao = match[1];
      const loginDoUsuario = await recuperarLoginDoUsuarioAutenticado(autenticacao);
      req.loginDoUsuario = loginDoUsuario;
    }
    next();
  }));
  
  app.use('/tarefas', tarefasRouter);
  app.use('/usuarios', usuariosRouter);
  app.use('/etiquetas', etiquetasRouter);
  app.use('/categorias', categoriasRouter);
  
  app.use((_req, res) => {
    res.status(404).send({
      razao: 'Rota não existe.'
    });
  });
  
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
};
```

E adapte o `app.js` dessa maneira:

```js
import express from 'express';
import setupApp from './setup-app.js';

const app = express();
setupApp(app);
app.listen(8080);
```

Agora crie o arquivo `testes/app-de-teste.js`:

```js
import express from 'express';
import comTransacaoDeTeste from './transacao-de-teste';
import setupApp from '../setup-app';

export default (callback) => {
  return comTransacaoDeTeste(async (trx) => {
    const appDeTeste = express();
    appDeTeste.use(function (req, _res, next) {
      req.uow = trx;
      next();
    });
    setupApp(appDeTeste);
    await callback(appDeTeste, trx);
  });
};
```

E adapte o método `comUnidadeDeTrabalho` no arquivo `querybuilder.js`:

```js
export function comUnidadeDeTrabalho () {
  return function (req, res, next) {
    if (req.uow) { // esse if foi adicionado
      next();
      return;
    }
    knex.transaction(function (trx) {
      res.on('finish', function () {
        if (res.statusCode < 200 || res.statusCode > 299) {
          trx.rollback();
        } else {
          trx.commit();
        }
      });
      req.uow = trx;
      next();
    });
  }
}
```

Com o supertest e essa preparação agora é possível escrever testes nesse nível. Crie um arquivo chamado `tarefas/router.test.js` com o seguinte conteúdo:

```js
import request from 'supertest';
import comAppDeTeste from '../testes/app-de-teste';
import { fabricarEtiqueta, fabricarTarefa, fabricarUsuario } from '../testes/fabrica';

import { gerarToken } from '../usuarios/model';

describe('vincularEtiqueta', () => {
  it('deve cadastrar a etiqueta se ela ainda não existir', comAppDeTeste(async (appDeTeste, trx) => {
    const idUsuario = await fabricarUsuario(trx, { login: 'fulano' });
    const idTarefa = await fabricarTarefa(trx, { idUsuario });
    await request(appDeTeste)
      .post(`/tarefas/${idTarefa}/etiquetas`)
      .set('Authorization', `Bearer ${gerarToken('fulano')}`)
      .send({ etiqueta: 'youtube' })
      .expect(204);
    let res = await trx('etiquetas')
      .select(['id', 'descricao']);
    expect(res.length).toBe(1);
    expect(res[0].descricao).toBe('youtube');
    const idEtiqueta = res[0].id;
    res = await trx('tarefa_etiqueta')
      .select(['id_tarefa', 'id_etiqueta']);
    expect(res.length).toBe(1);
    expect(res[0].id_tarefa).toBe(idTarefa);
    expect(res[0].id_etiqueta).toBe(idEtiqueta);
  }));

  it('deve funcionar se a etiqueta já existir', comAppDeTeste(async (appDeTeste, trx) => {
    const idUsuario = await fabricarUsuario(trx, { login: 'fulano' });
    const idTarefa = await fabricarTarefa(trx, { idUsuario });
    const idEtiqueta = await fabricarEtiqueta(trx, { descricao: 'youtube' });
    await request(appDeTeste)
      .post(`/tarefas/${idTarefa}/etiquetas`)
      .set('Authorization', `Bearer ${gerarToken('fulano')}`)
      .send({ etiqueta: 'youtube' })
      .expect(204);
    const res = await trx('tarefa_etiqueta')
      .select(['id_tarefa', 'id_etiqueta']);
    expect(res.length).toBe(1);
    expect(res[0].id_tarefa).toBe(idTarefa);
    expect(res[0].id_etiqueta).toBe(idEtiqueta);
  }));
});

export default {};
```

Note que uma pequena refatoração no arquivo `usuarios/model.js` foi necessária para expor uma maneira de gerar um token de autenticação dado um login:

```js
export function gerarToken (login) {
  return jwt.sign({
    login,
    exp: Math.floor(new Date().getTime() / 1000) + 10 * 60 * 60 /* 10 horas */
  }, JWT_SECRET);
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
  return gerarToken(login);
}
```
