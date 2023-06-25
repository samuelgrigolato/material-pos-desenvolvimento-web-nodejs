# Introdução ao Node.js e ao JavaScript

Nós vimos código JavaScript executando no navegador e na nossa API, mas ainda está longe de estar claro como tudo funciona "por baixo do capô". Uma pessoa vindo de outra linguagem pode trazer consigo conceitos e tentar mapeá-los diretamente e sofrer muito no processo. Por exemplo, você já deve ter ouvido falar (ou está ouvindo agora) que o JavaScript executa *em uma única thread* (ignore os módulos Web Worker / Worker Threads caso os conheça). Levando isso em conta, como justificar o funcionamento desse bloco de código?

```js
for (let i = 0; i < 5; i++) {
  setTimeout(function () {
    console.log(`i=${i}`);
  }, Math.random() * 1000);
}
```

Nota: troque `let` para `var` e veja o que acontece. O problema aqui é que o escopo de variáveis declaradas com `var` é sempre da função enquanto `let` fica restrito ao bloco (neste caso o bloco é a iteração) onde foi declarado. A forma de resolver antes das palavras-chave `let` e `const` era:

```js
for (var i = 0; i < 5; i++) {
  (function (thisI) {
    setTimeout(function () {
      console.log(`i=${thisI}`);
    }, Math.random() * 1000);
  })(i);
}
```

Repare que não estamos analisando um exemplo artificial, mesmo no código de hello world da seção anterior nós vimos o uso de funções passadas como callback (de fato isso é uma das características mais marcantes do desenvolvimento Node.js). Isso indica que é essencial ter uma sólida compreensão do funcionamento do JavaScript antes de se aventurar com a plataforma.

## A engine V8

JavaScript é uma linguagem com muitas implementações (também chamadas de engines). Uma dessas engines é a V8 (usada nos navegadores baseados no Chromium). Essa engine também é a responsável por executar aplicações Node.js.

## O Event Loop

Event Loop é o centro do modelo de execução do JavaScript, independente da engine utilizada. Para entender do que se trata nada melhor do que uma ferramenta visual que nos ajuda neste processo: http://latentflip.com/loupe (também existe essa que permite visualizar também micro tasks: https://www.jsv9000.app/). Use esses códigos e verifique o funcionamento:

```js
function a() { console.log('a'); }
function b() { a(); }
function c() { b(); }
c();
```

```js
function a() { console.log('a'); }
function b() {
  setTimeout(function () {
    console.log('b1');
  }, 1000);
  a();
  setTimeout(function () {
    console.log('b2');
  }, 500);
}
function c() { b(); }
c();
```

Use a ferramenta jsv9000 para este aqui:

```js
function respToText (resp) { return resp.text(); }

function printBeginning (text) { console.log(text.substr(0, 50)); }

fetch('https://viacep.com.br/ws/14820464/json/')
  .then(respToText)
  .then(printBeginning);

let i = 0;
function ping () {
  if (i < 10) {
    i++;
    setTimeout(ping, Math.random() * 50);
  }
}
setTimeout(ping, Math.random() * 50);
```

Volte para a outra ferramenta e agora adicione também HTML na seção inferior:

```js
function um () {
  setTimeout(function () {
    console.log('um');
  }, 1000);
}
$.on("#um", "click", um);

function cpu () {
  for (let i = 0; i < 5; i++) {}
}
$.on("#cpu", "click", cpu);
```

```html
<button id="um">1s</button>
<button id="cpu">"Bastante" CPU</button>
```

Após a análise desses exemplos podemos compreender melhor alguns conceitos do Event Loop:

* Task: bloco de código JavaScript síncrono que sempre executa do início ao fim. Apenas uma task pode estar rodando em um mesmo instante. Uma task registra outras tasks ou faz chamadas para Web APIs que futuramente vão agendar tasks;

* Task Queue: é a fila de tasks principal, a mais antiga nessa fila é a próxima a ser executada. No caso do Node.js, se não existirem mais tasks nessa fila nem Web APIs em execução a aplicação é encerrada. Esse detalhe pode causar situações onde sua aplicação não fecha mesmo após o script inicial ter finalizado, como veremos mais a frente;

* Script inicial: é a primeira task executada. Normalmente faz várias chamadas de APIs que mantém o software rodando.

Existem outros conceitos como Microtasks, as várias fases do ciclo de vida do Node.js e a diferenciação entre `setTimeout()`, `setImmediate()`, `queueMicrotask()` e `process.nextTick()` que não estão sendo abordados aqui.

Mas e se eu precisar de threads? É possível, utilizando `worker_threads`. Note que dificilmente você vai precisar disso:

[Projeto 01_workers](projetos/01_workers/)

```js
const { Worker, isMainThread } = require('worker_threads');

if (isMainThread) {
  new Worker(__filename);
  new Worker(__filename);
  new Worker(__filename);
  new Worker(__filename);
} else {
  console.log('worker...');
  for (let i = 0; i < 10000000000; i++) {};
}

//for (let i = 0; i < 10000000000; i++) {};
```

[Exercício 01_soma_paralela](exercicios/01_soma_paralela/README.md)

## A linguagem JavaScript

Além do conhecimento sobre Event Loop, é importante ter uma boa base na linguagem JavaScript para ser efetivo no desenvolvimento de APIs com Node.js.

JavaScript é uma linguagem de tipagem dinâmica (no sentido de que a checagem de tipos acontece em execução) e fraca (no sentido de que você pode por exemplo somar um número com uma string e não será impedido).

### Tipos primitivos

O JavaScript possui os seguintes tipos primitivos:

```js
let a = true; // boolean
console.log(typeof a);
a = null; // "null" é um tipo
console.log(typeof a); // o operador typeof retorna "object" pois JavaScript é assim: https://stackoverflow.com/questions/18808226/why-is-typeof-null-object
a = undefined;
console.log(typeof a);
a = 123; // números
console.log(typeof a);
a = 123.45; // ainda números
console.log(typeof a);
a = 123.111111111222222223333333; // ainda números
console.log(typeof a);
a = +Infinity; // ainda números
console.log(typeof a);
a = -Infinity; // ainda números
console.log(typeof a);
a = NaN; // ainda números
console.log(typeof a);
a = 5n; // bigints
console.log(typeof a);
a = 5n; // bigints
console.log(typeof a);
a = '123';
console.log(typeof a); // strings
a = Symbol('abc');
console.log(typeof a); // símbolos (são diferentes de símbolos em linguagens como Ruby!)
```

### "Objetos"

Também existem estruturas mais complexas:

```js
let x = { a: 1 }; // objetos
x["b"] = 2;
x.c = 3;
console.log(typeof x, x.a + x.b + x["c"]);

x = function (a) { return a * 2; }
x.b = 10;
console.log(typeof x, x(5) + x.b); // funções (que também são objetos!)

x = new Date();
console.log(typeof x, x); // datas, ficamos no aguardo da especificação do Temporal: https://tc39.es/proposal-temporal/docs/index.html

x = [ 20, 1, 40, 3, 5 ];
console.log(typeof x, x); // arrays
x.sort();
console.log(x);
x = [ true, "1", -Infinity, [ 2, 3, "oi" ], "abc" ];
x.sort();
console.log(x);
x.push(Symbol("já é demais"));
x.sort();

// esse aqui precisa rodar no repl do Node.js
// 0000001000000110 (2 e 6 unsigned ints esquerda pra direita)
x = Buffer.from("AgY=", "base64");
console.log(typeof x);
x = Uint8Array.of(2, 6);
console.log(typeof x);
```

### Estruturas condicionais e iteradores

```js
let x = 5;
if (x < Infinity) {
  console.log('tudo certo com essa implementação JavaScript');
}

x = [ "a", "b", "c" ];
for (let i = 0; i < x.length; i++) {
  console.log(i, x[i]);
}
for (let i in x) { // i aqui é STRING!!!! https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for...in#array_iteration_and_for...in
  console.log(i, x[i]);
}
for (let n of x) {
  console.log(n);
}
let i = 0;
while (i < x.length) {
  console.log(x[i]);
  i++;
}
```

### Funções e geradores

```js
function somar (a, b) {
  return a + b;
}
console.log(somar(2, 3));

let subtrair = function (a, b) {
  return a - b;
};
console.log(subtrair(5, 3));
console.log(subtrair.apply(null, [ 10, 3 ]));
console.log(subtrair.call(null, 10, 3));

const somar5 = somar.bind(null, 5); // currying "with extra steps" (mudança de contexto)
console.log(somar5(3));

const somar10 = function (b) {
  return somar(10, b);
};
console.log(somar10(5));

const debitoTecnico = function () {
  let i = 1;
  return function () { // closures: // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Closures#closure
    return i++;
  };
};
x = debitoTecnico();
console.log(x(), x(), x());

function* pares () { // geradores
  let n = 2;
  while (true) {
    yield n;
    n = n + 2;
  }
}
x = pares();
console.log(x.next(), x.next(), x.next());
```

### Hoisting e modo estrito

No JavaScript as variáveis declaradas com `var` tem sua declaração (mas não sua inicialização) movida para o topo do escopo em que estão definidas! Veja:

```js
function hoisting () {

  n1 = 5;

  var n2 = 10;

  n3 = 20;
  var n3;

  console.log(n1, n2, n3);

}
hoisting();
console.log(n1);
// console.log(n2, n3) <<< não funciona
```

Uma maneira de se proteger dessa situação é habilitar o modo estrito do JavaScript, colocando a expressão literal `"use strict";` no começo do arquivo ou da função que quer proteger:

```js
"use strict";
function naoVaiFuncionar () {
  acidentalmenteGlobal = 10;
}
naoVaiFuncionar();
```

O modo estrito habilita uma série de outras proteções, e é o modo recomendável para se escrever novas bases de código JS.

### This, globalThis, thisThis, that, (...)

Caso você conheça orientação a objetos, vai reconhecer a palavra `this` (ou `self`) como uma referência para a instância que está recebendo a chamada (ou mensagem). Esse conceito é bem mais complicado no JavaScript. Além disso há diferença no modo estrito discutido na seção anterior.

Para começar a entender a palavra reservada `this`, veja o que ela representa no escopo global:

```js
console.log(this);
```

No navegador isso vai imprimir o objeto `window`, enquanto no Node isso vai imprimir um objeto do tipo `[global]`. Daqui pra frente chamaremos esse objeto de contexto global.

Veja o bloco abaixo que demonstra o `this` dentro de uma chamada de função:

```js
function thisEmFuncao () {
  console.log(this);
}
thisEmFuncao();
```

Repare que o `this` aqui também é o contexto global. Sendo mais específico, ele foi *herdado* no momento da chamada. Esse conceito é importante para entender o restante dos casos.

Se habilitarmos o modo estrito, o `this` passa a ser `undefined` neste caso:

```js
function thisEmFuncaoEstrita () {
  "use strict";
  console.log(this);
}
thisEmFuncaoEstrita();
```

Quando então o `this` faz referência para outros valores? Uma das maneiras de atingir isso é chamar uma função *a partir de um objeto*:

```js
const pessoa = {
  nome: "Alguém",
  dizerOi: function () {
    console.log(this.nome);
  }
};
pessoa.dizerOi();
```

Neste ponto é bem natural confundir o `this` com o operador de linguagens focadas em orientação a objetos. Mas veja o que acontece neste caso:

```js
const pessoa = [...]
const referenciaParaDizerOi = pessoa.dizerOi;
referenciaParaDizerOi();
```

E podemos piorar:

```js
const robo = {
  nome: "T1025B",
  x: referenciaParaDizerOi
};
robo.x();
```

É evidente que esse código representa uma boa coleção de más práticas de desenvolvimento, mas compreender que é possível e o que está acontecendo ali é essencial para efetuar qualquer tipo de manutenção em JavaScript.

Em alguns casos (quem conhece `React` antes dos `hooks` vai entender) queremos fixar o `this` em uma função para impedir que seu contexto varie independente da forma como foi chamada. Para isso é possível usar a chamada `bind`:

```js
function dizerOi () {
  console.log(this.nome);
}

const pessoa2 = { nome: "Alguém" };
pessoa2.dizerOi = dizerOi.bind(pessoa2);

pessoa2.dizerOi();

const referenciaParaDizerOiPessoa2 = pessoa2.dizerOi;
referenciaParaDizerOiPessoa2();
```

Neste ponto é possível explicar o resto do título da seção: `thisThis` e `that` são alguns dos nomes usados para criar variáveis que mantém referência para diferentes contextos de execução em cadeias complexas de callbacks. Normalmente indica problemas no design do código.

Além da função `bind`, as funções possuem também a `apply` e a `call`, que permitem passar um contexto de modo explícito para a chamada (note que só vai funcionar para funções que não possuem um contexto fixado anteriormente via `bind`):

```js
function somar (b, c) {
  console.log(this.a + b + c);
}
somar.apply({ a: 1 }, [ 2, 3 ]);
somar.call({ a: 1 }, 2, 3);
const somarFixado = somar.bind({ a: 5 });
somarFixado.call({ a: 1 }, 0, 0);
```

### Operador "new"

Para entender o operador `new`, vamos fazer exatamente o que ele faz, só que manualmente:

```js
function Pessoa (nome) {
  this.nome = nome;
}
Pessoa.prototype.dizerOi = function () {
  console.log(this.nome);
};

const pessoa = Object.create(Pessoa.prototype);
// uma alternativa para a linha acima seria:
// const pessoa = {};
// pessoa.__proto__ = Pessoa.prototype;

Pessoa.call(pessoa, "Alguém"); // aqui tem uma pequena variação

pessoa.dizerOi();
```

E agora magicamente com esse operador:

```js
const pessoa2 = new Pessoa("Alguém 2");
pessoa2.dizerOi();
```

Por tabela nós vimos também como funciona a hierarquia via protótipos.

### Arrow functions

Um observador atento vai reparar que até o momento não utilizamos nenhuma vez a sintaxe de arrow functions! Isso é de propósito, pois só agora temos o conhecimento necessário para defini-las! Arrow functions são funções que *herdam o contexto de execução* do lugar onde foram definidas, e não do lugar onde foram chamadas! Essa diferença é muito importante e útil. Veja:

```js
function Pessoa (nome, idade) {
  this.nome = nome;
  this.idade = idade;
}
// Pessoa.prototype.construirSomadorDeIdade = () => { // não vai funcionar aqui
Pessoa.prototype.construirSomadorDeIdade = function () {
  // const thisThis = this; // não faça isso
  // return function (x) {
  //   return thisThis.idade + x;
  // };
  return x => this.idade + x; // o this dessa função sempre vai ser o mesmo this do local onde ela foi definida, não importa como é chamada
}

const pessoa = new Pessoa('Alguém', 20);
const somarComIdade = pessoa.construirSomadorDeIdade();
console.log(somarComIdade(5));
```

### Classes

No JavaScript moderno (nem tão moderno assim) foi introduzida uma syntax sugar para definição de funções com protótipo, através da palavra-chave `class`:

```js
class Pessoa {
  constructor (nome, idade) {
    this.nome = nome;
    this.idade = idade;
  }

  construirSomadorDeIdade() {
    return x => this.idade + x;
    // return function (x) { // vai apresentar o mesmo problema do anterior
    //   return this.idade + x;
    // }
  }

  dizerOi() {
    console.log(this.nome);
  }
}

const pessoa = new Pessoa("Alguém 3", 30);
pessoa.dizerOi();
console.log(pessoa.construirSomadorDeIdade()(5));
```

[Exercício 02_classes](exercicios/02_classes/README.md)

### Datas

Em algum momento (e nesta disciplina não será diferente) sempre temos que lidar com datas. JavaScript tem uma fama complicada com isso, por conta das falhas de design no tipo builtin `Date`, normalmente envolvendo a falta de utilitários na API e a dificuldade de lidar com timezones. Veja:

```js
const agora = new Date();
console.log(agora.toISOString());
console.log(agora.getTime());
console.log(agora.getTimezoneOffset());
// não existe conhecimento no objeto Date sobre timezones
```

Uma alternativa muito boa para trabalhar com Timezones é a biblioteca `date-fns-tz`. Cuidado com `moment-timezone`, pois ela traz no bundle os dados e isso aumenta bastante o tamanho da página! Quando a especificação `Temporal` se tornar estável isso não será mais necessário.

### Errors (throw/catch/finally)

Erros vão acontecer em qualquer sistema não trivial. Esses erros possuem diversas categorias:

- Semântica inválida (lógica causando uma situação irrecuperável): no JavaScript praticamente a única maneira disso acontecer é acessar um método que não existe em um objeto ou tentar acessar algo em uma referência para `null` ou `undefined`.

- Falha em rotina assíncrona (comunicação): dispositivo offline, resposta do servidor diferente do esperado. Note que uma resposta diferente do "fluxo feliz" não deve ser considerada como erro na definição que está sendo proposta aqui.

- Funcionalidade: não é um erro que "quebra" o software, mas sim um erro de código que produz um resultado diferente do esperado pelo usuário. Se não for um problema muito crítico esse tipo de erro tende a ficar muito tempo escondido pois, por fundamento, é impossível identificá-lo de forma proativa.

Toda linguagem possui mecanismos e boas práticas para lidar com situações excepcionais. No caso do JavaScript esse mecanismo é o lançamento e captura de erros, também chamado de exceções em outras linguagens. Veja:

```js
class Pessoa {
  constructor (idade) {
    this.idade = idade;
  }

  isMaiorDeIdade() {
    return this.idade >= 18;
  }
}

const pessoa = new Pessoa(-10);
console.log(pessoa.idade, pessoa.isMaiorDeIdade());
```

É interessante permitir que essa situação (idade negativa) se alastre causando problemas em outros pontos do código ou dos dados dos sistemas? Provavelmente não, e uma das vantagens de trabalhar com exceções é ter uma codificação mais defensiva:

```js
class Pessoa {
  constructor (idade) {
    if (idade < 0) {
      throw new Error("idade < 0");
    }
    this.idade = idade;
  }

  isMaiorDeIdade() {
    return this.idade >= 18;
  }
}

const pessoa = new Pessoa(-10);
console.log(pessoa.idade, pessoa.isMaiorDeIdade());
```

Melhorou, mas ainda vai ocorrer um problema similar se passar outros tipos de dado que não um número:

```js
const pessoa2 = new Pessoa(true);
console.log(pessoa2.idade, pessoa2.isMaiorDeIdade());
```

Para evitar é possível checar se o parâmetro é do tipo certo (cuidado):

```js
class Pessoa {
  constructor (idade) {
    if (typeof idade !== "number") {
      throw new TypeError("idade não é número");
    }
    if (idade < 0) {
      throw new Error("idade < 0");
    }
    this.idade = idade;
  }

  isMaiorDeIdade() {
    return this.idade >= 18;
  }
}

const pessoa = new Pessoa(-10);
console.log(pessoa.idade, pessoa.isMaiorDeIdade());
```

Argumentadores argumentarão que desenvolver dessa forma joga fora todo o benefício de legibilidade de uma linguagem dinâmica. Outros argumentadores argumentarão que o benefício de segurança e manutenabilidade é muito mais importante. Escolha um lado e boa discussão. Linguagens que tipam estaticamente possuem o benefício dessa checagem sem ter que escrever condicionais, já que garantem tudo isso em tempo de compilação. Esse é um dos, senão o principal, motivos de sucesso do TypeScript.

Como evitar que esses erros propagem até o console, acarretando em confusão para o usuário do software? Para isso é necessário utilizar o esquema de `try/catch/finally`, bem similar ao presente em outras linguagens:

```js
try {
  const idade = 10;
  new Pessoa(idade);
  console.log("Sucesso!");
} catch (err) {
  console.log("Falha!");
  console.error(err);
  // garantir que o usuário veja o que ocorreu e possa reagir
  // isso pode significar a necessidade de criar estruturas de atributos
  // nos erros
} finally {
  console.log("Isso aqui vai executar sempre.");
}
```

### Promises

Observe este código desenvolvido anteriormente:

```js
function buscarCep() {
  const cep = document.getElementById('cep').value;
  fetch(`https://viacep.com.br/ws/${cep}/json/`)
    .then(function (resp) {
      return resp.json();
    })
    .then(function (dados) {
      document.getElementById('resultado').innerText = dados['logradouro'];
    })
    .catch(function (err) {
      document.getElementById('resultado').innerText = `Não foi possível carregar: ${err.message}`;
    });
}
```

Por qual motivo ele não pode ser desenvolvido dessa forma?

```js
function buscarCep() {
  try {
    const cep = document.getElementById('cep').value;
    const resp = fetch(`https://viacep.com.br/ws/${cep}/json/`);
    const dados = resp.json();
    document.getElementById('resultado').innerText = dados['logradouro'];
  } catch (err) {
    document.getElementById('resultado').innerText = `Não foi possível carregar: ${err.message}`;
  }
}
```

Afinal é isso que esperaríamos ver em outras linguagens. Uma parte dessa resposta é: Event Loop. Para evitar bloquear sua aplicação toda esperando a resposta da requisição HTTP (lembre-se que JavaScript é single thread) precisa ter uma fronteira explícita entre um bloco de execução síncrona e outro. A solução adotada inicialmente no JavaScript foi simplesmente passar funções de `callback` para chamadas de Web APIs, de modo que essa função seria chamada apenas quando apropriado, liberando a thread principal para executar outros blocos. Isso pode ser visto ainda hoje no `setTimeout`:

```js
function callback() {
  console.log('isso aqui está rodando em um segundo momento');
}
setTimeout(callback, 1000);
```

Conforme os callbacks foram se tornando parte fundamental do desenvolvimento JavaScript, a necessidade de simplificar casos mais complexos ficou evidente. Veja:

```js
buscarDadosDeCep(cep, function (dadosDoCep) {
  buscarEstimativaDeFrete(dadosDoCep.centroDeDistribuicao, function (estimativa) {
    // caso de sucesso aqui
  }, function (err) {
    // tratamento aqui
  });
}, function (err) {
  // tratamento aqui
});
```

Rapidamente isso fica difícil de ler, e a "solução" acaba com a ordem completamente invertida do código com o que de fato acontece:

```js
function onEstimativaDeFreteSuccess (estimativa) {

}
function onEstimativaDeFreteErr (err) {}
function onDadosDoCepSuccess (dadosDoCep) {
  buscarEstimativaDeFrete(dadosDoCep.centroDeDistribuicao, onEstimativaDeFreteSuccess, onEstimativaDeFreteErr);
}
function onDadosDoCepErr (err) {}

buscarDadosDeCep(cep, onDadosDoCepSuccess, onDadosDoCepErr);
```

Certamente é complicado ler, comparando com o algoritmo síncrono que propomos no início.

A primeira melhoria nessa questão veio com a introdução do conceito de promessas (Promises). Uma promessa tenta criar um canal superior onde os dados vão caminhando até o destino final, sem acabar com callbacks aninhados. Veja:

```js
buscarDadosDeCep(cep)
  .then(dadosDoCep => buscarEstimativaDeFrete(dadosDoCep.centroDeDistribuicao))
  .then(estimativa => {}) // para ter acesso aos dadosDoCep aqui um pouco de trabalho extra é necessário
  .catch(err => {}); // note que este tratamento é único para os dois casos de falha
```

Toda estrutura de callbacks pode ser encapsulada em uma promise, veja por exemplo como seria isso com a função `setTimeout`:

```js
function aguardarSegundos (segundos) {
  return new Promise(function (resolve, _reject) {
    setTimeout(resolve, segundos * 1000);
  });
}

aguardarSegundos(5).then(() => console.log("terminou"));
```

Esse processo é chamado de "promessificação" (promisify) e o Node possui inclusive um utilitário para fazer isso automaticamente, caso a função que usa callbacks siga algumas regras básicas: https://nodejs.org/dist/latest-v8.x/docs/api/util.html.

### Async/await

E se você pudesse escrever exatamente aquele código síncrono, sem perder o comportamento assíncrono e toda a simplicidade do desenvolvimento single-thread? Isso é na verdade possível desde o surgimento das cláusulas `async` e `await`.

Para entender essa sintaxe podemos começar aplicando a cláusula `async` em uma função. Veja o que acontece com seu retorno:

```js
function getNumeroAleatorio () {
  return Math.ceil(Math.random() * 10);
}
console.log(getNumeroAleatorio());
async function getNumeroAleatorio2 () {
  return Math.ceil(Math.random() * 10);
}
const promise = getNumeroAleatorio2();
console.log(promise);
promise.then(console.log);
```

Veja que definir uma função como assíncrona automaticamente muda seu retorno para uma Promise, mesmo se o corpo for síncrono! Quando isso é útil? Quando combinada com a palavra-chave `await`, é possível escrever cadeias de chamadas assíncronas de modo muito mais legível, veja:

```js
async function buscarLogradouro(cep) {
  const resp = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
  const json = await resp.json();
  return json['logradouro'];
}
```

Note que você só pode usar await se já estiver em um contexto async (caso contrário a stack estaria potencialmente esperando uma resposta síncrona).

Um outro benefício é o suporte do `try/catch` em contextos async: erros tanto na parte síncrona quanto identificados durante a resolução das promessas vão cair no catch:

```js
async function buscarLogradouro(cep) {
  try {
    const resp = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
    const json = await resp.json();
    return json['logradouro'];
  } catch (err) {
    console.warn(err);
    return '-'; // dificilmente é o que você quer, mas serve para exemplificar
  }
}
```

Para facilitar a compreensão vale reforçar que todo método assíncrono pode ser reescrito com promises (e vice-versa). Veja:

```js
function buscarLogradouro(cep) {
  return fetch(`https://viacep.com.br/ws/${cep}/json/`)
    .then(resp => resp.json())
    .then(json => json['logradouro'])
    .catch(err => {
      console.warn(err);
      return "-";
    });
}
```

Note que a cláusula `await` pode ser utilizada em métodos que retornam `Promise`, eles não precisam necessariamente ser `async`.

## Módulos (import/export)

Voltando as atenções agora ao Node.js, como dividir o código-fonte em vários arquivos ou "módulos"? Algumas linguagens chamam de pacote, outras de namespace, mas o objetivo é sempre o mesmo: criar um mecanismo que permita o aparecimento de um ecossistema de bibliotecas e que também facilite a manutenção da base de código conforme ele cresce.

Módulos são importados através da chamada `require` (ou da sintaxe `import` como veremos em breve). No código que fizemos de exemplo de back-end fizemos a importação do módulo `http`.

Para definir um módulo basta criar um arquivo com o nome desejado, ou um diretório com um arquivo `index.js` dentro. Esses arquivos possuem um objeto especial chamado `module.exports` que, se definido, transforma o arquivo ou pastas em um módulo importável. Com a opção de módulos ES6 é possível usar também a sintaxe `export`. Veja um exemplo:

Arquivo `calculadora/somar.js`:

```js
module.exports = function (a, b) {
  return a + b;
}
```

Arquivo `calculadora/index.js`:

```js
const somar = require('./somar');

module.exports = { somar };
```

Arquivo `app.js`:

```js
const calculadora = require('./calculadora');

console.log(calculadora.somar(3, 5));
```

Agora vamos converter para ES6. Note que para conseguir executar após as alterações, é necessário criar um arquivo chamado `package.json` junto com o `app.js`, com o seguinte conteúdo:

```json
{
  "type": "module"
}
```

Discutiremos mais sobre este arquivo no módulo sobre `Fastify`. Além disso, discutiremos sobre uma alternativa mais abaixo. Agora altere o arquivo `calculadora/somar.js`:

```js
export default function (a, b) {
  return a + b;
}
```

Arquivo `calculadora/index.js`:

```js
export { default as somar } from './somar.js';
```

Arquivo `app.js`:

```js
import { somar } from './calculadora/index.js'; // o "explode" pode ser feito na versão sem ES6 também, usando "require" (CommonJS).

console.log(somar(3, 5));
```

Note que o uso de export/import só saiu do status experimental no Node.js 14. Ao invés de usar o `package.json`, uma outra maneira de ativar o módulo ES6 é usando a extensão `.mjs` nos arquivos. Além disso, observe que para importar os módulos tivemos que usar o nome completo, incluindo a extensão, o que não ocorre em projetos que usam `babel` e/ou `TypeScript` na etapa de transpilação.

[Exercício 03_async_await](exercicios/03_async_await/README.md)

## Juntando tudo isso

Para encerrar esse processo todo vamos implementar um projeto com as seguintes funcionalidades:

- Abrir uma porta para receber requisições HTTP
- Distribuir as requisições recebidas usando o módulo `cluster`

Comece criando um arquivo `package.json` para definir o uso de módulos ES6:

```json
{
  "type": "module"
}
```

Agora crie um arquivo `server.js`:

```js

import cluster from 'cluster';

const WORKER_COUNT = 4;

if (cluster.isPrimary) {

  console.log('Primary');

  const workers = [];
  for (let i = 0; i < WORKER_COUNT; i++) {
    workers.push(cluster.fork({
      WORKER_ID: i
    }));
  }

} else {

  console.log(`Worker #${process.env.WORKER_ID}`);

  cluster.worker.kill();

}
```

A ideia é então combinarmos o módulo cluster com o módulo `http`, para melhorar a capacidade do nosso servidor em atender requisições paralelas:

```js
import cluster from 'cluster';
import http from 'http';
import querystring from 'querystring';

const WORKER_COUNT = 4;


if (cluster.isPrimary) {

  console.log('Primary');

  const workers = [];
  for (let i = 0; i < WORKER_COUNT; i++) {
    workers.push(cluster.fork({
      WORKER_ID: i
    }));
  }

} else {

  const wid = process.env.WORKER_ID;

  console.log(`Worker #${wid}`);

  const server = http.createServer(function (req, resp) {
    const url = req.url;
    const params = querystring.parse(url.substring(url.indexOf('?') + 1));
    console.log(`W#${wid}: processando i=${params.i}`);
    // essa versão dá pouca diferença, mesmo
    // com um único worker, pois o event loop
    // não fica travado
    // setTimeout(function () {
    //   resp.write('Olá!');
    //   resp.end();
    // }, Math.random() * 3000 + 1000);
    // essa versão apresenta uma diferença
    // muito grande! pois o código síncrono
    // trava o event loop de 1 único worker
    if (Math.floor(Math.random() * 2) === 0.0) {
      for (let i = 0; i < 5000000000; i++) {};
    }
    resp.write(`Olá, ${params.i}!`);
    resp.end();
  });

  server.listen(8080);

}
```

Crie também um arquivo `client.js` para nos ajudar a exercitar este servidor:

```js
async function dizerOi(i) {
  try {
    const resp = await fetch(`http://localhost:8080/?i=${i}`);
    if (resp.ok) {
      const text = await resp.text();
      console.log(`#${i}: tudo certo '${text}'`);
    } else {
      console.log(`#${i}: deu erro http ${resp.status}`);
    }
  } catch (err) {
    console.log(`#${i}: deu erro ${err.message}`);
  }
}

function main() {
  for (let i = 0; i < 10; i++) {
    dizerOi(i);
  }
}

main();
```

Note como a versão com setTimeout aleatório praticamente não é afetada com o acréscimo de workers. Isso ocorre por conta da forma como o Event Loop funciona. Quando existem tarefas pesadas rodando nele, no entanto, o uso do módulo cluster passa a ser muito útil.
