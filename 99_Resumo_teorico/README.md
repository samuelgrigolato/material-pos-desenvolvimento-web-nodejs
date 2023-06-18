# Resumo teórico

Use este material como um complemento de estudos focado na teoria do conteúdo apresentado em aula. Este resumo está dividido em 5 seções:

1. JavaScript
2. Protocolo HTTP
3. Node.js
4. Express
5. Knex

## JavaScript

A linguagem JavaScript surgiu para atender um fim específico: servir de ferramenta para desenvolvimento de comportamentos dinâmicos simples em páginas HTML. Com o tempo ela passou a tomar conta das aplicações e ser a tecnologia mais importante do desenvolvimento front-end moderno.

### Event Loop

Um dos principais diferenciais da linguagem JavaScript está no seu modelo de execução. Ao invés de entregar um modelo baseado em threads como praticamente todas as outras linguagens, existe um componente chamado *Event Loop* responsável por orquestrar a execução de *tarefas*. Essas tarefas executam em uma única thread (ou seja, não há paralelismo), facilitando a gestão de concorrência. Além disso essas tarefas podem chamar *Web APIs* como o método *fetch* ou o *setTimeout*, estes sim potencialmente executando paralelamente.

Executar uma tarefa longa no Event Loop tem o potencial de travar todo o seu processo Node.js, pois outras tarefas não conseguem ser executadas enquanto esta não finalizar. Esta característica é ao mesmo tempo a principal vantagem e armadilha de APIs Node.js.

### Contexto de execução (*runtime binding*, *this*)

O contexto de execução (*this*) de um bloco de código JavaScript não é exatamente igual o que normalmente se encontra em outras linguagens. Ao invés de ser obrigatoriamente a instância dona da função chamada (conceito de orientação a objetos), é um objeto que definido com base na forma como a função foi chamada:

```js
// aqui o contexto é simplesmente o mesmo do contexto atual
cadastrarPessoa(arg1, arg2);

// aqui a instância "pessoa" será o contexto de execução
pessoa.cadastrar(arg1, arg2);

// aqui "ctx" será o contexto da chamada
cadastrarPessoa.call(ctx, arg1, arg2);

// neste caso o contexto atual será propagado
// a não ser que cadastrar tenha sido definida como uma "arrow function"
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

## Express

Uma das primeiras necessidades ao se desenvolver uma API back-end usando Node.js é o recebimento da requisição HTTP e envio da resposta. A plataforma oferece módulos nativos para isso (como o `http`) mas esses módulos não oferecem boas abstrações para o desenvolvimento de APIs acarretando em código complexo, verboso e repetitivo. Nesse contexto surge o *Express* como uma abstração sobre os módulos nativos facilitando o desenvolvimento de APIs.

### Endpoints

A principal abstração do Express é a definição dos endpoints, como no exemplo abaixo (`app` é uma instância configurada de Express):

```js
app.get('/pessoas/:id', (req, res, next) => {
  const id = req.params.id;
  buscarPessoa(id)
    .then(pessoa => res.send(pessoa))
    .catch(next);
  ;
});
```

Note que a abstração permite definir o método (GET), o caminho incluindo parâmetros (`/pessoas/:id`), a execução assíncrona e envio da resposta.

### Middlewares

Essa abstração permite adicionar comportamentos globais da sua API. É muito usado para processar corpos de requisição (JSON, uploads etc.), aplicar rotinas de autenticação, log de requisições dentre outras coisas. Exemplo de Middleware responsável por registrar as requisições:

```js
app.use((req, res, next) => {
  res.on("finish", () => {
    const date = new Date();
    console.log(`${date.toISOString()} [${req.method}] ${req.path} ${res.statusCode}`);
  });
  next();
});
```

### Validação dos dados de entrada

É importante higienizar e validar os dados recebidos no corpo de uma requisição HTTP, para evitar brechas de segurança ou bugs difíceis de diagnosticar. O Express não fornece mecanismos nativos para isso, mas existem bibliotecas que permitem o desenvolvimento dessa validação com certa facilidade. Um exemplo é a biblioteca `ajv`, que fornece uma abstração para incorporar validação de objetos JavaScript usando a notação JSON Schema.

### Routers

Com o crescimento de uma base de código Express passa a ser necessário organizar melhor o código dos endpoints. Uma abstração que ajuda consideravelmente nessa organização é a de roteadores (routers). Um router é uma subaplicação Express e praticamente tudo que pode ser feito na aplicação raiz (registro de endpoints, Middleware etc.) também pode ser feito nele. Um router é um Middleware e portanto pode ser registrado na aplicação raiz (ou em outro router) com um prefixo opcional.

### Tratamento de erros

Quando seu cliente envia uma requisição com dados inválidos, ou parte da sua infraestrutura está fora do ar, ou a credencial anexada na requisição expirou, como você lida com a situação? Além de ser um tratamento que agrega pouco na razão de existir do endpoint, ele é um exemplo de tratamento que deve ser aplicado a toda a API de forma consistente. Por essas razões é normal que frameworks de APIs forneçam abstrações para tratamento de erros, e no Express não é diferente. Ao definir um Middleware com 4 parâmetros, esse Middleware vai atuar como um *error handler*, permitindo assim encapsular de forma global o tratamento de erros desejado.

### Autenticação stateful e JWT

Existem duas abordagens mais comuns para tratamento de autenticação em APIs Web: cookies e o cabeçalho Authorization. As duas possuem prós e contras que giram em torno de segurança e praticidade de uso. Independente da solução escolhida para o transporte da credencial, é possível trabalhar com autenticação stateful (ou seja, a credencial não carrega informações suficientes para identificar o usuário e a sua validade, sendo necessário manter uma base de informações de tokens no back-end e consultá-la sempre que uma requisição for feita) ou stateless (gerando uma credencial que carrega a identificação do usuário e metadados sobre sua validade sem risco de ser forjada, sendo o JSON Web Token a principal solução desse tipo atualmente).

JSON Web Tokens possuem uma *assinatura* que impede que este seja forjado ou manipulado sem o conhecimento da chave que o gerou. O conteúdo de um JWT não é *criptografado*, no entanto, logo não é recomendado adicionar informações sensíveis nele. Além da assinatura a estrutura do JWT se divide em cabeçalho e payload/corpo.

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
