# Resumo teórico

Use este material como um complemento de estudos focado na teoria do conteúdo apresentado em aula. Este resumo está dividido em 7 seções:

1. JavaScript
2. TypeScript
3. Protocolo HTTP
4. Node.js
5. Fastify
6. Knex
7. Testes automatizados

## JavaScript

A linguagem JavaScript surgiu para atender um fim específico: servir de ferramenta para desenvolvimento de comportamentos dinâmicos simples em páginas HTML. Com o tempo ela passou a tomar conta das aplicações e ser a tecnologia mais importante do desenvolvimento front-end moderno.

### Event Loop

Um dos principais diferenciais da linguagem JavaScript está no seu modelo de execução. Ao invés de entregar um modelo baseado em threads como praticamente todas as outras linguagens, existe um componente chamado *Event Loop* responsável por orquestrar a execução de *tarefas*. Essas tarefas executam em uma única thread (ou seja, não há paralelismo), facilitando a gestão de concorrência. Além disso essas tarefas podem chamar *Web APIs* como o método *fetch* ou o *setTimeout*, estes sim potencialmente executando paralelamente.

Executar uma tarefa longa no Event Loop tem o potencial de travar todo o seu processo Node.js, pois outras tarefas não conseguem ser executadas enquanto esta não finalizar. Esta característica é ao mesmo tempo a principal vantagem e armadilha de APIs escritas em Node.js.

### Contexto de execução (*runtime binding*, *this*)

O contexto de execução (*this*) de um bloco de código JavaScript não é exatamente igual o que normalmente se encontra em outras linguagens. Ao invés de ser obrigatoriamente a instância dona da função chamada (conceito de orientação a objetos), é um objeto definido com base na forma como a função foi chamada:

```js
// aqui o contexto é simplesmente o mesmo do contexto atual
cadastrarPessoa(arg1, arg2);

// aqui a instância "pessoa" será o contexto de execução
pessoa.cadastrar(arg1, arg2);

// aqui "ctx" será o contexto da chamada
cadastrarPessoa.call(ctx, arg1, arg2);

// neste caso o contexto atual será propagado
// a não ser que "cadastrar" tenha sido definida como uma "arrow function"
// ou que seu contexto tenha sido forçado com uma chamada "fn.bind(ctx)"
const ref = pessoa.cadastrar;
ref(arg1, arg2);
```

No caso de definição de "Arrow Functions" (`(a, b) => {}`) o contexto é definido com base no local onde *a função foi definida* ao invés do local onde ela foi chamada. Isso não acontece com a sintaxe padrão de definição de funções (`function (a, b) {}`).

### Callbacks, Promises e Async/Await

Como as tarefas JavaScript são executadas em uma única thread, é primordial que os blocos de código não sejam bloqueantes, ou seja, não consumam a CPU por muito tempo. Felizmente é exatamente essa a característica da maioria das APIs HTTP (o que é um dos motivos para a plataforma Node.js ser tão popular).

Mas o que fazer quando o bloco de código precisa executar uma operação custosa e fazer algo com base nos resultados? É nesse momento que surgem os callbacks:

```js
console.log('bloco original, log 1');
setTimeout(function () {
  console.log('segundo bloco, log 1');
}, 1000);
console.log('bloco original, log 2');
```

Note que essa estrutura quebra a execução, potencialmente longa, em três etapas:

- Primeiro bloco JavaScript, que faz a chamada de Web API (no caso do exemplo essa chamada é a `setTimeout`);
- Execução da Web API fora do Event Loop e potencialmente em paralelo com outras rotinas;
- Enfileiramento do segundo bloco JavaScript após o término da Web API.

Ter vários callbacks aninhados rapidamente se torna um desenvolvimento verboso e de difícil leitura. Pensando em resolver este problema surgem as Promises:

```js
buscarPessoa()
  .then(agregarDadosFinanceiros)
  .then(dados => {
    atualizarElementosNaPagina(dados);
    reiniciarFormularioDeAceite();
  })
  .catch(tratarErro);
```

Ainda assim o desenvolvimento pode se mostrar confuso, e para aproximar de vez o desenvolvimento assíncrono do desenvolvimento síncrono surge o async/await:

```js
try {
  const pessoa = await buscarPessoa();
  const dados = await agregarDadosFinanceiros(pessoa);
  atualizarElementosNaPagina(dados);
  reiniciarFormularioDeAceite();
} catch (err) {
  tratarErro(err);
}
```

É importante frisar que o código acima com async/await é equivalente ao anterior, usando Promises.

### Módulos

Projetos maiores precisam se preocupar com a organização do código, facilitando a leitura, navegação e consequentemente a manutenção. JavaScript não foi originalmente desenhado para grandes projetos, o que acarretou no surgimento de soluções *criativas* como CommonJS e AMD. Veja um exemplo de módulo sendo definido e importado usando CommonJS:

```js
// calculadora.js
module.exports.somar = function (a, b) {
  return a + b;
}

// app.js
const calculadora = require('./calculadora.js');
console.log(calculadora.somar(5, 10));
```

E a mesma coisa usando ES Modules (abordagem nativa da linguagem JavaScript disponível a partir do ECMAScript 2015 ou ES6):

```js
// calculadora.js
export function somar (a, b) {
  return a + b;
}

// app.js
import calculadora from './calculadora.js';
console.log(calculadora.somar(5, 10));
```

A modularização do JavaScript é necessária independentemente do projeto ser focado em front-end ou back-end.

## Protocolo HTTP

A principal ferramenta que seu navegador de Internet utiliza para se comunicar com as aplicações web é o protocolo HTTP. Assim que você digita uma URL ou clica em um link, a primeira coisa que acontece é uma requisição para buscar o recurso principal (normalmente uma página HTML). A partir da página HTML outros recursos são obtidos, como imagens, scripts JavaScript e folhas de estilo CSS. Sempre que um bloco de código JavaScript faz uma chamada para um servidor, essa chamada é feita utilizando o mesmo protocolo.

Uma requisição HTTP é composta da seguinte forma:

* *Método*: indica a intenção da requisição, sendo os principais: GET, POST, PATCH, PUT, DELETE. Nada impede que o servidor backend desrespeite essa indicação, mas considera-se como forte boa prática que as APIs sejam desenhadas respeitando os padrões;

* *Caminho*: ex: `/pessoas?termo=aline`, é a parte que fica depois do endereço do servidor e da porta na URL. O backend utiliza essa informação para *rotear* a requisição e identificar seus parâmetros;

* *Corpo*: permite enviar dados quaisquer como parte da requisição. Em APIs normalmente se envia objetos JSON.

* *Cabeçalhos*: mapa de atributos que permite manipular vários aspectos da requisição. Alguns exemplos:

  * Content-Type: indica o tipo de corpo enviado;
  * Accept-Language: indica os idiomas preferenciais do requisitante;
  * Authorization: permite passar credenciais de acesso. Seu uso é comum para liberar o acesso em todas as requisições da aplicação, enquanto a requisição específica que verifica o usuário e senha (gerando assim o token que é passado neste cabeçalho) normalmente passa essas informações no próprio corpo da requisição ao invés do cabeçalho.

Já a resposta é composta por:

* *Status Code*: é um código que indica o resultado do processamento da requisição. Os intervalos mais importantes são:

  * 200-299: o processamento da requisição foi um sucesso!
  * 300-399: a operação solicitada está disponível em outro local (redirecionamento);
  * 400-499: a operação não pode ser concluída pois o requisitante passou alguma informação inválida (seja no corpo, cabeçalhos, ausência de autenticação, acesso negado etc);
  * 500-599: a operação não pode ser concluída pois o servidor está com problemas (defeito no código, indisponibilidade de infraestrutura etc).

* *Cabeçalhos*: tem o mesmo propósito dos cabeçalhos de requisição, mas permitem que o servidor indique como a resposta deve ser processada pelo cliente. Um uso muito comum é a manipulação de cache através do cabeçalho *Cache-Control*;

* *Corpo*: conteúdo principal da resposta, quando aplicável.

## TypeScript

JavaScript é uma linguagem dinâmica. Com a popularidade do JavaScript no desenvolvimento de APIs Node.js, uma tensão surgiu para o aparecimento de uma versão da linguagem com funcionalidades de tipagem estática. A linguagem que melhor preencheu essa lacuna foi o TypeScript.

Seu sucesso se deve ao fato de ser um super-conjunto do JavaScript, ou seja, todo código JavaScript é TypeScript válido, e ao fato de seu compilador transpilar para JavaScript ao invés de ser totalmente diferente. Isso significa que, no final, tudo ainda é JavaScript rodando em uma engine como a V8, simplificando muito sua adoção em projetos reais.

### Controle de fluxo

Uma das funcionalidades mais interessantes do TypeScript é sua inferência de tipos no controle de fluxo. Veja o código abaixo:

```ts
function imprimir(obj: string[] | string): void {
  if (typeof obj === 'string') {
    console.log(obj);
  } else {
    for (const x of obj) {
      console.log(x);
    }
  }
}
```

O compilador do TypeScript sabe que, no bloco `else` do código acima, `obj` só pode ser um vetor de strings, evitando expressões de "type cast" ou similares como teríamos em outras linguagens.

## Node.js

Com o avanço do JavaScript no desenvolvimento front-end surgiu um grande incentivo no desenvolvimento de uma plataforma para uso do JavaScript no back-end. O resultado desse incentivo é a plataforma Node.js. Ela empacota o motor de JavaScript V8 (o mesmo motor responsável pela execução de JavaScript no navegador Google Chrome) complementando-o com módulos nativos para os mais diversos fins, tornando-o viável para o desenvolvimento de ferramentas de linha de comando e APIs HTTP.

### Node Version Manager

Não se recomenda o uso de uma única instalação global de Node.js para o desenvolvimento de projetos. Isso pode acarretar em poluição de dependências além de impedir que o desenvolvedor atue simultaneamente em projetos que usam versões distintas da plataforma. Para combater essa dificuldade existem gestores de versão de Node.js como o NVM. Existem soluções equivalentes para Linux, Windows e MacOS.

### Gestão de dependências com Node Package Manager (NPM)

A maneira recomendada para instalar dependências nos projetos Node.js é usar a ferramenta NPM. O arquivo `package.json` contém metadados do projeto bem como a lista de dependências, permitindo que um novo desenvolvedor ou um pipeline de build faça a instalação completa com um único comando. O arquivo `package-lock.json` contém uma foto das versões exatas de toda a árvore de dependências (incluindo as transitivas) viabilizando assim *builds reproduzíveis*.

### Semantic Versioning (SemVer)

O desenvolvimento das dependências do seu projeto não param, e talvez você não queira usar a versão mais recente delas, sempre. Como mantenedor de uma dessas bibliotecas, como comunicar com clareza o que mudou de uma versão para outra na hora de publicá-la? Após o amadurecimento desse conceito surgiu o Semantic Versioning, que quebra um identificador de versão em três números, *MAJOR.MINOR.PATCH* (ex: 4.15.45):

* *MAJOR*: uma mudança neste número indica que a biblioteca passou por mudanças significativas e o mantenedor não garante que seu projeto vai continuar funcionando sem alterações de código;

* *MINOR*: uma mudança aqui indica que novas funcionalidades foram acrescentadas mas que a retrocompatibilidade foi mantida;

* *PATCH*: um acréscimo nessa parte indica apenas correções de bugs e/ou melhorias de performance e segurança. Note que é muito importante aplicar atualizações PATCH o quanto antes, pois elas podem conter correções de brechas de segurança recentemente identificadas.

Independente do que o mantenedor disse na publicação da versão, nenhuma atualização está comprovadamente livre de impactos no seu projeto, e a devida atenção e testes devem ser aplicados para garantir a qualidade das futuras implantações.

Com esse tipo de padronização é possível expressar na definição de dependências os intervalos de versões aceitas, ex: `^14.5.0` (a versão mais recente da MAJOR 14).

## Fastify

Uma das primeiras necessidades ao se desenvolver uma API back-end usando Node.js é o recebimento da requisição HTTP e envio da resposta. A plataforma oferece módulos nativos para isso (como o `http`) mas esses módulos não oferecem boas abstrações para o desenvolvimento de APIs acarretando em código complexo, verboso e repetitivo. Nesse contexto surgem frameworks como o *Fastify*, uma abstração sobre os módulos nativos facilitando o desenvolvimento de APIs.

### Endpoints

A principal abstração do Fastify é a definição dos endpoints, como no exemplo abaixo (`app` é uma instância configurada):

```ts
app.get('/:id', async (req, resp) => {
  const { id } = req.params as { id: string };
  const idTarefa = Number(id);
  const tarefa = await consultarTarefaPeloId(req.usuario, idTarefa, req.uow);
  return {
    descricao: tarefa.descricao,
    data_conclusao: tarefa.data_conclusao,
    id_categoria: tarefa.id_categoria,
    etiquetas: tarefa.etiquetas,
  };
});
```

Note que a abstração permite definir o método (GET), o caminho incluindo parâmetros (`/:id`), a execução assíncrona e retorno da resposta.

### Hooks

Essa abstração permite adicionar comportamentos globais da sua API. É muito usado para processar corpos de requisição (JSON, uploads etc.), aplicar rotinas de autenticação, log de requisições dentre outras coisas. Exemplo de hook responsável por autenticar usuários:

```js
app.addHook('preHandler', async (req, resp) => {
  const { authorization } = req.headers as { authorization?: string };
  if (authorization !== undefined) {
    const token = authorization.replace('Bearer ', '');
    const usuario = await recuperarUsuarioAutenticado(token, req.uow);
    req.usuario = usuario;
  }
  // não queremos disparar um erro se o usuário não estiver autenticado neste ponto,
  // pois algumas rotas podem ser públicas
});
```

### Plugins

Com o crescimento de uma base de código Fastify passa a ser necessário organizar melhor o código dos endpoints, além de incorporar funcionalidades fornecidas por bibliotecas de terceiros. A abstração do Fastify que permite isso é a de plugins. Um plugin é uma subaplicação Fastify e praticamente tudo que pode ser feito na aplicação raiz (registro de endpoints, hooks, outros plugins etc.) também pode ser feito nele. Um uso muito comum de plugins é a definição de módulos roteadores, para encapsular endpoints relacionados.

### Validação dos dados de entrada

É importante higienizar e validar os dados recebidos no corpo de uma requisição HTTP, para evitar brechas de segurança ou bugs difíceis de diagnosticar. O Fastify oferece suporte nativo para isso, através da definição de um `schema` para partes específicas da requisição utilizando `jsonschema`. Veja um exemplo:

```ts
const postSchema: FastifySchema = {
  body: {
    type: 'object',
    properties: {
      descricao: { type: 'string' },
      id_categoria: { type: 'number' },
    },
    required: ['descricao', 'id_categoria'],
    additionalProperties: false,
  },
  response: {
    201: {
      type: 'object',
      properties: {
        id: { type: 'number' },
      },
      required: ['id'],
    },
  },
};

app.post('/', { schema: postSchema }, async (req, resp) => {
  const dados = req.body as DadosTarefa;
  const id = await cadastrarTarefa(req.usuario, dados, req.uow);
  resp.status(201);
  return { id };
});
```

### Autenticação stateful e JWT

Existem duas abordagens mais comuns para tratamento de autenticação em APIs Web: cookies e o cabeçalho Authorization. As duas possuem prós e contras que giram em torno de segurança e praticidade de uso. Independente da solução escolhida para o transporte da credencial, é possível trabalhar com autenticação stateful (ou seja, a credencial não carrega informações suficientes para identificar o usuário e a sua validade, sendo necessário manter uma base de informações de tokens no back-end e consultá-la sempre que uma requisição for feita) ou stateless (gerando uma credencial que carrega a identificação do usuário e metadados sobre sua validade sem risco de ser forjada, sendo o JSON Web Token a principal solução desse tipo atualmente).

JSON Web Tokens possuem uma *assinatura* que impede que este seja forjado ou manipulado sem o conhecimento da chave que o gerou. O conteúdo de um JWT não é *criptografado*, logo não é recomendado adicionar informações sensíveis nele. Além da assinatura a estrutura do JWT se divide em cabeçalho e payload/corpo.

### Documentação utilizando OpenAPI

Um aspecto importante no desenvolvimento de APIs HTTP não é coberto pelo protocolo HTTP, infelizmente: a documentação detalhada dos endpoints oferecidos pela API. Com o amadurecimento desse processo nas equipes de desenvolvimento apareceu o padrão OpenAPI, que define um formato de arquivo de metadados que pode ser utilizado para gerar portais de documentação e até mesmo código-fonte base para interagir ou servir a API documentada. Também existem ferramentas que geram os metadados OpenAPI com base no código-fonte do projeto.

Documentação de APIs são úteis tanto para clientes externos quanto para equipes internas onde o front-end e back-end trabalham no mesmo projeto.

A escrita de uma boa documentação em conjunto com um robusto tratamento de erros é essencial para a entrega de uma API HTTP cujo uso é fácil e intuitivo.

## Armazenamento de dados com Knex

Com a exceção de casos triviais ou muito específicos, toda API vai precisar armazenar e acessar dados persistentes em algum momento. Ao invés de cuidar de todas as complicações inerentes desse processo no código da própria API, é comum delegar essas complexidades para um sistema de gerenciamento de banco de dados, independente do tipo de banco de dados (relacional, documento, chave-valor etc.).

Uma vez definido o sistema de gerenciamento é necessário definir como a o código da API vai se comunicar com ele. No caso dos bancos de dados relacionais existem 3 principais maneiras para se fazer isso:

* Driver direto: inclui como dependência um driver cuja única responsabilidade é estabelecer a conexão com o banco de dados e receber e executar comandos SQL, enviados como *strings*;

* Query builders (construtores de query): uma abstração leve sobre o driver direto, facilitando a construção de comandos SQL dinâmicos. A principal característica de um construtor de query é não esconder os conceitos de um banco de dados relacional do programador;

* Object-relational mapping (ORM): uma pesada camada de abstração cujo objetivo é esconder os conceitos de armazenamento relacional atrás de uma interface orientada a objetos. Sua principal característica é a necessidade de especificar o mapeamento do modelo relacional em um modelo de classes de objetos.

### Knex como opção de Query Builder

A biblioteca Knex é uma das mais populares ou a mais popular opção de query builder para Node.js. Uma de suas vantagens é trazer no mesmo pacote funcionalidades úteis para praticamente qualquer API, como um mecanismo de migrações de dados, gestor de pool de conexões etc.

### ACID

Existem quatro atributos chave para sistemas de armazenamento, que juntos formam o termo ACID:

* *Atomicidade*: possibilidade de executar um conjunto de instruções de forma atômica, ou seja, se uma falhar todas falham;

* *Consistência*: o banco de dados deve sair sempre de um estado consistente para outro após a execução completa de uma transação de acordo com suas invariantes. Note que isso não significa que o banco de dados é responsável por garantir as regras de negócio da sua aplicação;

* *Isolamento*: uma sessão de uso do banco de dados não deve interferir com nenhuma outra, e a execução de transações de modo concorrente deve produzir o mesmo resultado que executá-las de modo sequencial;

* *Durabilidade*: uma vez que o sistema de banco de dados indica o sucesso de uma operação, a informação armazenada nunca mais se perde independente do que aconteça com o servidor (reinicializações, instabilidade de rede etc.).

Note que algumas dessas propriedades podem ser totalmente ou parcialmente não atendidas em pról de performance ou escalabilidade em casos onde isso faça sentido.

### Migrações de esquema

Da mesma forma que usamos um sistema de versionamento de código-fonte (ex: Git) para registrar a evolução dos projetos, poder voltar no tempo e configurar pipelines de build para entregar atualizações em produção, podemos utilizar ferramentas de migração para controlar e registrar alterações no esquema de um banco de dados relacional.

É importante desenhar as migrações de modo que sejam retrocompatíveis, ou seja, mesmo após aplicar a alteração o sistema deve funcionar na versão de código-fonte imediatamente anterior ao deploy. Isso é necessário para facilitar processos de *rollback* caso venham a ser necessários, pois deixam de exigir um rollback de esquema junto com o rollback do executável. Na prática isso significa que não se deve excluir ou renomear tabelas que são usadas pela versão atual nem adicionar campos obrigatórios. A estratégia é primeiro deixar de usar as tabelas impactadas, criar uma view/apelido antes de renomear e adicionar campos permitindo nulos e somente em uma implantação futura ativar a marcação de obrigatoriedade.

### Transações

A atomicidade nos bancos relacionais é oferecida por padrão para comandos únicos, mas para estender este corportamento para qualquer conjunto de comandos é necessária a demarcação de uma transação. Esse comportamento é especialmente importante em APIs HTTP pois o erro em uma operação que manipula o banco de dados normalmente exige o cancelamento/desfazimento de tudo que já foi feito naquela mesma requisição.

O padrão Unidade de Trabalho é uma ferramenta útil e eficaz em projetos Node.js para propagar uma mesma transação em todas as chamadas de uma requisição HTTP.

## Testes automatizados

É difícil de se manter uma base de código de tamanho médio ou grande, sem uma boa cobertura de testes automatizados. Isso ocorre pois refatorações maiores sempre serão evitadas, visto que a equipe não tem confiança de que pode fazê-las sem causar estragos demais no funcionamento do sistema. Sem refatoração, o design do projeto tende a ruir com o tempo, levando a uma inevitável necessidade de reescrita completa.

Existem diversos tipos de teste automatizado, dentre deles os testes unitários e testes de integração. Testes unitários validam o funcionamento de *unidades* em isolamento, normalmente uma função, *mocando* (substituindo) todas as suas dependências. Por outro lado, testes de integração possuem um escopo maior, pois não substituem as dependências do bloco de código que está sendo testado.

### Test-Driven Development

Uma forma interessante de garantir uma boa cobertura de testes automatizados no seu projeto é o uso da técnica TDD (Test-Driven Development). Ela consiste em seguir as 3 regras abaixo durante o dia a dia do desenvolvimento:

1. Se os testes estão passando, escreva um único novo caso de teste que falha
2. Se tem testes falhando, escreva a versão mais simples do código que os faz passar
3. Se os testes estão passando, você pode refatorar o código existente, *sem que isso mude seu comportamento adicionando funcionalidades*

Esse ciclo permite que código seja desenvolvido com boa cobertura de testes logo do início.
