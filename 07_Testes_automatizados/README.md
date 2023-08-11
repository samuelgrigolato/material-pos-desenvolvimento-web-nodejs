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

O próximo passo são os testes de integração. Nele, começamos a adicionar dependências externas, de modo a garantir que o código do projeto funciona adequadamente quando se comunicando com eles. Por enquanto continuaremos na camada de modelo, mas não vamos mais "mocar" o acesso ao banco de dados.

Você pode se perguntar como é possível garantir a reproducibilidade e o isolamento dos casos de teste, já que estaremos nos comunicando com uma base de dados real. Existem duas formas de fazer isso:

1. Excluir e criar uma base de dados totalmente limpa (funciona bem para bases não-relacionais onde é barato destruir e criar tudo novamente)
2. Deixar a base com as migrações executadas, e dar rollback em uma transação global depois da execução dos testes (mais complexo de desenvolver, só que infinitamente mais rápido)

Vamos implementar uma cobertura de teste de integração para o método `alterarNome` do modelo de usuários. Um detalhe importante é que não queremos misturar o nosso desenvolvimento com a execução dos testes, então é interessante usarmos uma base específica para isso. Vamos começar pelo script que vai ficar responsável por coordenar essa execução. Crie um arquivo chamado `rodar_testes.sh` (se você está no Windows pode adaptar em um .bat, ou então ignorar essa parte e usar a mesma base):

```sh
#!/bin/bash

set -e

export DATABASE_URL='postgres://postgres:postgres@localhost:5432/testes'
export JWT_SECRET='123456'
npx knex migrate:latest
npx jest
```

A ideia é que toda execução de testes garanta que estamos com a base na última versão das migrações, e use essa base alternativa ao invés da nossa base de desenvolvimento. Vamos agora garantir que o comando `npm t` execute esse script:

```sh
$ chmod +x rodar_testes.sh
```

```json
{
  "scripts": {
    "build": "rm -rf build && tsc -p tsconfig.json",
    "start": "cd build && JWT_SECRET=123456 node app.js",
    "test": "./rodar_testes.sh"
  }
}
```

O próximo passo é fazer o código entender e usar a variável de ambiente `DATABASE_URL` sempre que ela estiver disponível. Isso precisa ser feito tanto no `knexfile.ts` quanto no arquivo `shared/querybuilder.ts`:

```ts
import type { Knex } from 'knex';

const config: { [key: string]: Knex.Config } = {
  development: {
    client: 'postgresql',
    connection: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/postgres',
    migrations: {
      tableName: 'knex_migrations',
      extension: 'ts',
    }
  },
};

export default config;
```

```ts
import knexLib from 'knex';

const knex = knexLib({
  client: 'pg',
  connection: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/postgres',
  debug: true
});

export default knex;
```

Rode novamente o comando `npm t` e veja que o knex vai reclamar que não encontrou a base `testes`. Crie-a e tente novamente. Estamos prontos para implementar nosso teste de integração isolado e reproduzível! Crie um arquivo `usuarios/model.test.ts`:

```ts
import knex from '../shared/querybuilder';
import { alterarNome } from './model';


describe('usuarios/model', () => {

  describe('#alterarNome', () => {

    it('deve trocar o nome do usuário', async () => {
      await knex.transaction(async (trx) => {
        const usuario = {
          id: -1,
          nome: 'Clara',
          senha: '???',
          admin: false,
          login: 'clara',
        };
        await trx('usuarios').insert(usuario);
        await alterarNome(usuario, 'Aralc', trx);
        const usuarioAlterado = await trx('usuarios')
          .select('nome')
          .where({ id: -1 })
          .first();
        expect(usuarioAlterado).not.toBeUndefined();
        expect(usuarioAlterado?.nome).toEqual('Aralc');
        await trx.rollback(); // uma exceção já vai dar rollback
      });
    });

  });

});
```

Está funcionando, mas o jest fica reclamando de um processo que não finalizou corretamente. Isso acontece pois estamos ativando o knex, que deixa uma Web API aberta em segundo plano, impedindo que o processo Node.js encerre totalmente. Para resolver isso temos que fechar manualmente o Knex após a execução de todos os testes. Vamos usar a configuração `setupFilesAfterEnv` do jest para isso:

```js
/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testPathIgnorePatterns: ['/node_modules/', '/build/'],
  setupFilesAfterEnv: ['./setupTest.ts'],
};
```

E criar o arquivo `setupTest.ts`:

```ts
import knex from './shared/querybuilder';


afterAll(async () => {
  await knex.destroy();
});
```

[Exercício 02_vinculo_etiqueta_tarefa](exercicios/02_vinculo_etiqueta_tarefa/README.md)

O último tipo de teste que adicionaremos é o da camada do Fastify. Desenvolveremos ele no mesmo estilo do teste de integração de modelo, ou seja, com uma unidade de trabalho real que sempre faz um rollback no final do teste. Para conseguirmos fazer isso com o Fastify o processo será bem mais complicado, dado o nível de entrelaçamento que temos entre o Fastify e o conceito de unidade de trabalho.

Nosso objetivo final é ter uma instância de app Fastify que use uma versão diferente do plugin de unidade de trabalho quando estiver sendo executada nos testes. Vamos começar criando um arquivo `app-factory.ts`:

```ts
import fastify, { FastifyPluginCallback } from 'fastify';

import { Chatbot } from './chatbot/api';
import chatbotPlugin from './chatbot/fastify-plugin';
import { recuperarUsuarioAutenticado } from './usuarios/model';
import usuariosRouter from './usuarios/router';
import tarefasRouter from './tarefas/router';
import etiquetasRouter from './etiquetas/router';
import categoriasRouter from './categorias/router';
import { ErroNoProcessamento } from './shared/erros';


export default (uowPlugin: FastifyPluginCallback, chatbot: Chatbot) => {
  const app = fastify({ logger: true });

  app.setNotFoundHandler((req, resp) => {
    resp.status(404).send({ erro: 'Rota não encontrada' });
  });

  // ...

  app.decorateRequest('usuario', null);
  app.register(chatbotPlugin(chatbot));
  app.register(uowPlugin);

  // ...

  app.register(usuariosRouter, { prefix: '/usuarios' });
  app.register(tarefasRouter, { prefix: '/tarefas' });
  app.register(etiquetasRouter, { prefix: '/etiquetas' });
  app.register(categoriasRouter, { prefix: '/categorias' });
  
  return app;
};
```

Adapte o `app.ts` para usar essa fábrica, garantindo que tanto o app quanto o teste usem o mesmo código:

```ts
import openai from './chatbot/openai';
import uowPlugin from './core/uow';
import appFactory from './app-factory';


const app = appFactory(uowPlugin, openai);


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

Agora podemos usar a mesma estratégia dos testes de integração na camada de modelo, passando a transação para o método fábrica de instância do Fastify. Vamos exercitar isso testando o método de alteração de nome do usuário na camada de roteador. Crie um arquivo `usuarios/router.test.ts`:

```ts
import { FastifyInstance } from 'fastify';
import fastifyPlugin from 'fastify-plugin';
import { Knex } from 'knex';

import knex from '../shared/querybuilder';
import papagaio from '../chatbot/papagaio';
import appFactory from '../app-factory';
import { gerarToken } from './model';


const testUowPlugin = (trx: Knex.Transaction) =>
  fastifyPlugin(async (app: FastifyInstance) => {
    app.decorate('uow');
    app.addHook('onRequest', async (req) => {
      req.uow = trx;
    });
  });


describe('usuarios/router', () => {

  describe('PUT /usuarios/autenticado/nome', () => {

    it('deve alterar o nome do usuário logado', async () => {
      await knex.transaction(async (trx) => {
        await trx('usuarios')
          .insert({
            id: -1,
            nome: 'Fulano',
            senha: '???',
            admin: false,
            login: 'fulano',
          });

        const app = appFactory(testUowPlugin(trx), papagaio);
        const resp = await app.inject({
          method: 'PUT',
          path: '/usuarios/autenticado/nome',
          headers: {
            'content-type': 'application/json',
            'authorization': `Bearer ${gerarToken('fulano')}`
          },
          payload: { nome: 'Onaluf' },
        });

        expect(resp.statusCode).toEqual(204);

        const res = await trx('usuarios')
          .select('nome')
          .where({ login: 'fulano' });
        expect(res[0].nome).toEqual('Onaluf');

        await trx.rollback(); // uma exceção já vai dar rollback
      });
    });

  });

});
```

Note que foi necessário expor o método `gerarToken` no arquivo `usuarios/model.ts`:

```ts
export function gerarToken(login: string): string {
  return jwt.sign({
    login,
    exp: Math.floor(new Date().getTime() / 1000) + 10 * 24 * 60 * 60 /* 10 dias */
  }, JWT_SECRET);
}

export async function autenticar (login: Login, senha: Senha, uow: Knex): Promise<TokenAutenticacao> {
  // ...
  return gerarToken(login);
}
```
