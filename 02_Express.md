# Express

No último tópico foi apresentada uma revisão de aplicações web, depois uma análise do modelo de execução do JavaScript, e também uma introdução ao Node.js. No final foi abordado o desenvolvimento de uma API HTTP usando nada além do que já está disponível nativamente na plataforma.

Durante o desenvolvimento da API HTTP, algumas coisas claramente se mostraram difíceis de resolver, produzindo código frágil e mal organizado, como por exemplo:

- *Processamento do corpo da requisição:* foi necessário tratar o recebimento dos dados em "chunks". A implementação que foi feita (concatenação de strings) só funciona com dados textuais, não funcionaria para upload de arquivos, por exemplo. Se a entrada for JSON, a conversão para um objeto JavaScript e validação dos dados de entrada também foi feita manualmente, o que não é o ideal.

- *Roteamento da requisição:* foi usada uma grande carga de manipulação de strings para rotear as chamadas. Isso rapidamente deixa o código poluído e difícil de entender.

- *Tratamento de casos de erro:* como o módulo HTTP não oferece nada com relação a tratamento de erros, foi necessário codificar com cuidado para garantir que toda requisição tivesse uma resposta, mesmo em casos de exceção. Isso fica ainda pior se considerar o fato de que o processamento costuma ser assíncrono (baseado em callbacks/Promises).

Além disso, algumas coisas nem chegaram a ser abordadas, como:

- *Disponibilização de arquivos estáticos (HTML/CSS/JavaScript de front-end):* não é a única maneira, mas uma forma bem simples de disponibilizar sua aplicação para os usuários é através do próprio servidor de back-end.

- *Upload/download de arquivos*

- *Segurança:* como trabalhar a autenticação dos usuários da aplicação? Quais os mecanismos disponíveis e quando usar cada um deles?

Nesta seção será abordado como usar o framework Express para permitir o desenvolvimento de uma API com todas essas características.

## Node Package Manager (NPM)

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

Esse comando instala a dependência `@angular/material` no projeto. Repare que o comando reclama de um `peer dependency` que você precisa instalar manualmente, o `@angular/cdk`. Uma ótima leitura sobre isso pode ser vista aqui: https://stackoverflow.com/questions/26737819/why-use-peer-dependencies-in-npm-for-plugins, e aqui: https://nodejs.org/en/blog/npm/peer-dependencies/. Também discutiremos sobre isso mais abaixo.

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

## Instalação do Express e primeiro projeto

Agora que ficou claro o uso do `npm`, é possível iniciar um novo projeto e adicionar o framework `express` como dependência. Vá até um diretório vazio na sua máquina e digite o seguinte comando:

```
npm init
```

Se o seu projeto não vai ser consumido por outros como uma biblioteca, é uma boa ideia remover o atributo `main` e adicionar `private: true` no arquivo `package.json` que foi gerado.

Adicione agora a dependência para a versão mais recente do Express:

```
npm install express
```

O que é esse arquivo `package-lock.json` que foi criado? Está fora do escopo desta disciplina, mas duas ótimas discussões sobre este arquivo podem ser encontradas aqui: https://renovatebot.com/docs/dependency-pinning/ e aqui: https://github.com/commitizen/cz-conventional-changelog-default-export/pull/4#issuecomment-358038966.

Agora crie um arquivo chamado `index.js`, colocando o conteúdo abaixo:

```js
const express = require('express');
const app = express()


app.get('/ola', (req, res) => {
    const nome = req.query.nome;
    res.send(`Olá, ${nome}!`);
});

app.listen(3000, () => {
    console.log('Primeira API com Express.');
});
```

Note que já é possível observar algumas diferenças drásticas com relação ao tópico anterior. Primeiro, não foi necessário fechar a resposta, o próprio método `send` já faz isso. Segundo, o objeto `req` vem enriquecido com dados da requisição, não há a necessidade de processar esses dados na mão. Terceiro, o roteamento fica muito mais simples, por padrão a resposta sempre será 404, a não ser que o caminho e método se mostre compatível a alguma das chamadas no estilo `app.get`. Veja esse outro exemplo, envolvendo parâmetros de caminho e corpo:

```js
app.use(express.json());

app.post('/pessoas/:id/telefones', (req, res) => {
    const idPessoa = req.params.id;
    const telefone = req.body;
    console.log(idPessoa);
    console.log(telefone);
    res.send();
});
```

Note que o atributo `body` só ficou disponível depois de instalarmos um `middleware` de processamento de corpo de requisição.

## Express Generator

Existe uma ferramenta de geração de código disponível para usuários de Express, chamada Express Generator. Para utilizá-la, primeiro instale-a usando `npm`:

```
npm install -g express-generator
```

Agora, em um diretório, execute o seguinte comando para criar a estrutura básica de um projeto (será criado um diretório com o nome `02_generator`):

```
express 02_generator
```

Entre no diretório do projeto e instale as dependências:

```
npm install
```

E execute-o com o comando `npm start`. Você pode acessar a aplicação no navegador, no endereço `http://localhost:3000`.

Algumas observações:

* Para uma API HTTP, você provavelmente não vai usar a parte de `views`. É possível gerar um projeto sem essa parte, com o comando `express --no-view`.

* Repare que o diretório `public` é servido como um diretório de arquivos estáticos, isso resolve mais um dos pontos propostos no início deste tópico. A "mágica" ocorre no arquivo `app.js`, na linha que instala o *middleware* `express.static` na aplicação. Mais detalhes sobre middlewares serão fornecidos mais abaixo.

* É possível observar aqui que o Express estimula a modularização dos endpoints em `Routers`. Uma boa analogia é considerar cada `Router` como uma mini aplicação express, *embutida* na aplicação raíz.

A decisão entre usar o Express Generator ou não cabe a cada equipe, mas normalmente o ideal é começar do zero, adicionando apenas aquilo que o projeto de fato necessita. O valor desse tipo de ferramenta está na fase de aprendizado, para aqueles que querem ter algo funcionando para então ter uma ideia daquilo que é considerado boa prática.

## Middlewares

Antes de refazer o CRUD de tarefas usando Express, vale discutir sobre o conceito de `Middlewares`. Um Middleware, dentro do Express, nada mais é uma função que será chamada para todas as requisições, capaz de enriquecer os dados da requisição/resposta, finalizar uma resposta automaticamente (tratamento de erros, segurança, etc), dentre outras. Uma forma de ver é comparar com o conceito de `plug-in`. Veja o exemplo abaixo, que demonstra o funcionamento dos middlewares na implementação de auditoria e segurança (bem rudimentares):

```js
const express = require('express');
const url = require('url');
const app = express();

app.use((req, res, next) => {
    console.log('Interceptando a requisição: ', req.url);
    const reqUrl = url.parse(req.url, true);
    if (reqUrl.path.startsWith('/admin')) {
        const senha = req.header('X-SenhaAdmin');
        if (senha === 'senha123') {
            next();
        } else {
            res.status(403).send('Apenas administradores podem acessar este recurso');
        }
    } else {
        next();
    }
});

app.get('/clientes', (req, res) => res.send(['João', 'Maria']));

app.get('/admin/clientes/restritos', (req, res) => res.send(['João']));

app.listen(3000);
```

Note que esse não é nem de longe um código pronto para ser usado em um projeto real, tente acessar `http://localhost:3000/Admin/clientes/restritos` (com o A maiúsculo) por exemplo e veja o motivo. Questões críticas como segurança devem ser implementadas com muito cuidado, e preferencialmente delegadas para bibliotecas/frameworks especializados nisso. No entanto, como o objetivo aqui é exercitar o desenvolvimento de middlewares customizados, a fragilidade não tem tanta importância.

Por mais que seja possível e até incentivado o desenvolvimento de middlewares customizados, o mais comum é que pacotes de funcionalidades externos sejam adicionados dessa forma, como é o caso do middleware `express.static` que vimos na seção anterior.

## Refazendo o CRUD de tarefas

Para continuar demonstrando o uso do Express, vale refazer alguns endpoints do tópico anterior. Como ainda não será utilizado Knex e uma base relacional, o módulo `tarefas/tarefas-modelo.js` pode ser copiado do jeito que estava, para este novo projeto.

Comece criando um novo projeto Express:

```
npm init
npm i express
```

E criando um arquivo `index.js` com o seguinte conteúdo:

```js
const express = require('express');
const app = express();

app.use(express.json());

app.listen(3000);
```

Por mais que seja possível implementar todos os endpoints direto neste arquivo, conforme o projeto cresce essa prática fica completamente inviável. A solução do Express para este problema de modularização é a definição de `Routers`. Crie uma pasta chamada `tarefas`, com um arquivo chamado `tarefas-router.js` dentro dela, com o seguinte conteúdo:

```js
const express = require('express');
const router = express.Router();

const modelo = require('./tarefas-modelo');


router.get('/', (req, res) => {
    res.send(modelo.listar(req.query.filtro));
});

router.get('/:id', (req, res) => {
    res.send(modelo.buscarPorId(req.params.id));
});

router.post('/', (req, res) => {
    const body = req.body;
    const tarefa = new modelo.Tarefa(body.descricao, body.previsao);
    modelo.cadastrar(tarefa);
    res.send();
});

module.exports = router;
```

Copie o `tarefas-modelo.js` desenvolvido na seção anterior para a pasta `tarefas`.

Por fim, ajuste o `index.js` para configurar o router como se ele fosse um middleware (de fato todo router é um middleware de uma aplicação Express):

```js
const express = require('express');
const app = express();

const tarefasRouter = require('./tarefas/tarefas-router');


app.use(express.json());
app.use('/tarefas', tarefasRouter);

app.listen(3000);
```

Tire um tempo para comparar essa solução com a do tópico anterior, especialmente as partes que ficaram abstraídas pelo Express.

## Validação de dados de entrada

Uma das características discutidas no início deste tópico foi a validação de dados de entrada. O framework Express não possui nada nativo com relação a isso (exceto a conversão automática de `json`, que já vem sendo usada nas seções anteriores), mas a comunidade criou várias bibliotecas que permitem adicionar esse tipo de validação no seu projeto. Uma delas é a `express-validator`. Existem várias maneiras de usá-la, e neste tópico serão apresentadas duas delas. Primeiro instale a ferramenta no projeto:

```
npm i express-validator
```

A primeira forma de usá-la é adicionando uma lista de validações como middlewares em cada endpoint. Veja:

```js
const express = require('express');
const { check, validationResult } = require('express-validator');
const router = express.Router();

const modelo = require('./tarefas-modelo');


router.get('/', (req, res) => {
    res.send(modelo.listar(req.query.filtro));
});

router.get('/:id', (req, res) => {
    res.send(modelo.buscarPorId(req.params.id));
});

router.post('/',
    check('descricao').isLength({ min: 3, max: 100 })
        .withMessage('Deve ser um valor entre 3 e 100 caracteres.'),
    check('previsao').toDate().not().isEmpty()
        .withMessage('Deve ser uma data válida.'),
    (req, res) => {

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ errors: errors.array() });
            return;
        }

        const body = req.body;
        const previsao = body.previsao.toISOString();
        const tarefa = new modelo.Tarefa(body.descricao, previsao);
        modelo.cadastrar(tarefa);
        res.send();
    });

module.exports = router;
```

A parte importante aqui é a inclusão da dependência `express-validator`, o uso de cadeias de validação (chamadas `check` no handler de cadastro de tarefa) e o uso do método `validationResult` para verificar se houve erro de validação ou não, antes de prosseguir com o tratamento normal da requisição.

A outra maneira é através do uso do middleware `checkSchema`:

```js
const express = require('express');
const { checkSchema, validationResult } = require('express-validator');
const router = express.Router();

const modelo = require('./tarefas-modelo');


router.get('/', (req, res) => {
    res.send(modelo.listar(req.query.filtro));
});

router.get('/:id', (req, res) => {
    res.send(modelo.buscarPorId(req.params.id));
});

router.post('/',
    checkSchema({
        descricao: {
            in: 'body',
            errorMessage: 'Deve ser um valor entre 3 e 100 caracteres.',
            isLength: {
                options: {
                    min: 3,
                    max: 100
                }
            }
        },
        previsao: {
            in: 'body',
            errorMessage: 'Deve ser uma data válida.',
            toDate: true,
            isEmpty: {
                negated: true
            }
        }
    }),
    (req, res) => {

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ errors: errors.array() });
            return;
        }

        const body = req.body;
        const previsao = body.previsao.toISOString();
        const tarefa = new modelo.Tarefa(body.descricao, previsao);
        modelo.cadastrar(tarefa);
        res.send();
    });

module.exports = router;
```

As duas formas possuem prós e contras, cabe a equipe do projeto decidir qual ou quais usar no código-fonte.

TODO:

- Trabalhando com anexos (upload)
    - Tratar imagens de forma especial (crop/resize?)
        https://stackoverflow.com/questions/13938686/can-i-load-a-local-file-into-an-html-canvas-element
        https://github.com/fengyuanchen/cropperjs/blob/master/README.md#features
- Adicionando segurança (login)
    basic
    jwt no localstorage/sessionstorage
