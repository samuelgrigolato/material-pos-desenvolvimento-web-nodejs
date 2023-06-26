# TypeScript

A linguagem [TypeScript](https://www.typescriptlang.org/) é um superconjunto da linguagem JavaScript, adicionando características de linguagens fortemente tipadas.

A intenção do TypeScript não é substituir o ecossistema JavaScript, mas sim reutilizá-lo. Código TS é compilado para JS e este sim é executável pelo Node ou pelo navegador.

## Instalação e primeiros exemplos

O primeiro passo para se usar TypeScript é instalar seu compilador, o `tsc`. Isso é feito pelo Node Package Manager (npm). Vamos ver como o npm funciona em mais detalhes no próximo módulo (Fastify). Por enquanto basta utilizar o comando abaixo para instalar o compilador `tsc` globalmente:

```sh
$ npm install -g typescript
$ tsc -version
Version 5.1.3
```

Garanta que sua versão é igual ou mais recente que esta antes de continuar.

Vamos começar com um exemplo simples, mas já suficiente para mostrar o benefício do uso da linguagem. Crie um arquivo chamado `hello.js` com o código abaixo:

```ts
const mensagem = 'olá!';

mensagem();
```

Ao executar este código no navegador ou no runtime Node, o seguinte erro será apresentado:

```
$ node hello.js
[...]
mensagem();
^

TypeError: mensagem is not a function
[...]
```

Isso ocorre pois strings não são "chamáveis" em JavaScript. Não seria útil se a IDE ou alguma outra ferramenta nos ajudasse a evitar este tipo de erro? É exatamente isso o que a adição de "tipagem" no nosso processo de desenvolvimento traz. Crie agora um arquivo chamado `index.ts` com o mesmo conteúdo e execute o compilador:

```sh
$ tsc index.ts
hello.ts:3:1 - error TS2349: This expression is not callable.
  Type 'String' has no call signatures.

3 mensagem();
```

Veja que o compilador ajudou a evitar que este erro chegasse até a execução. Se você abrir este arquivo em alguma IDE com suporte, o erro aparecerá diretamente no IDE, sem que seja necessário compilar.

Vamos a um segundo exemplo. Crie um arquivo chamado `propriedade.js` com o conteúdo abaixo:

```js
const user = {
  name: "Daniel",
  age: 26,
};
console.log(user.location); // returns undefined
```

Nada de errado aqui do ponto de vista do JavaScript, mas certamente a intenção não era acessar um atributo que nunca foi definido. Crie agora um outro arquivo com a extensão `.ts` e execute o compilador:

```sh
$ tsc propriedade.ts
propriedade.ts:5:18 - error TS2339: Property 'location' does not exist on type '{ name: string; age: number; }'.

5 console.log(user.location); // returns undefined
```

Repare que ao chamar o compilador, o arquivo `js` está sendo substituído por uma versão ligeiramente diferente. Isso é o resultado da compilação: lembre-se que o TypeScript não possui (até o momento) um motor de execução próprio, então o processo é compilar para JavaScript e executar o JavaScript normalmente.

## Tipos

A partir de agora o código será sempre escrito em TypeScript, portanto lembre-se de compilá-lo com `tsc` antes de testá-lo no Node.js ou no navegador.

Começando com uma simples rotulação com o tipo `any`:

```ts
const nome: any = 'José';
console.log(nome);
```

O tipo `any` é um tipo que não oferece nenhum conhecimento extra sobre o valor da referência. De certa forma, pode se dizer que o uso de `any` efetivamente desliga a checagem de tipo, fazendo com que o compilador se comporte exatamente como JavaScript puro. Por esse motivo, o `any` deve ser evitado, sendo útil apenas quando fazendo interface com bibliotecas ou partes do código que não estão tipadas.

Vamos melhorar usando o tipo `string`:

```ts
const nome: string = 'José';
console.log(nome);
```

Se você possuir uma IDE com suporte para TypeScript, pode notar que mesmo sem a definição explícita do tipo `string`, o compilador é capaz de *inferir* que o tipo da variável `nome` é string. Isso é útil e deve ser aproveitado, reduzindo a verbosidade.

Nem sempre o compilador consegue fazer essa inferência, no entanto. Veja o exemplo abaixo:

```ts
function dizerOi(nome) {
  console.log(`Olá, ${nome}!`);
}

dizerOi('José');
```

Neste caso, como a função `dizerOi` pode estar sendo utilizada em outros lugares, o tipo do parâmetro `nome` resulta em `any`, sendo que o melhor é ser uma `string`, como mostra o código alterado abaixo:

```ts
function dizerOi(nome: string) {
  console.log(`Olá, ${nome}!`);
}

dizerOi('José');
// dizerOi(5); -- Argument of type 'number' is not assignable to parameter of type 'string'.
```

Funções também possuem um tipo de retorno:

```ts
function duplicar(valor: number): number {
  return valor * 2;
}

const x = duplicar(5); // tipo de x é inferido como number
```

Podemos usar a definição de tipos customizados (ou aliases) para *documentar* melhor os retornos e parâmetros:

```ts
type UUIDString = string;

function gerarId(): UUIDString {
  ...
}
```

Uma das características mais poderosas da tipagem TypeScript é a definição de tipos de objetos. Veja o exemplo abaixo:

```ts
type Pessoa = {
  nome: string;
  idade: number;
}

function ehMaiorDeIdade(pessoa: Pessoa): boolean {
  return pessoa.idade >= 18;
}

const jose = {
  nome: 'José',
  idade: 25
};

console.log(ehMaiorDeIdade(jose), jose.nome);
```

É possível usar o operador `|` para definir um tipo derivado que é a união desses tipos, ou seja, o valor pode ser um OU outro:

```ts
type Pessoa = {
  nome: string;
  idade: number;
}

function ehMaiorDeIdade(pessoaOuIdade: Pessoa | number): boolean {
  let idade: number;
  if (typeof pessoaOuIdade === 'number') {
    idade = pessoaOuIdade;
  } else {
    idade = pessoaOuIdade.idade;
  }
  return idade >= 18;
}

const jose = {
  nome: 'José',
  idade: 25
};

console.log(ehMaiorDeIdade(jose), jose.nome);
console.log(ehMaiorDeIdade(30));
```

De modo similar, é possível usar o operador `&` para representar a *intersecção* entre tipos, ou seja, o valor precisa atender a todos os tipos ao mesmo tempo:

```ts
type Pessoa = {
  nome: string;
  idade: number;
};

type Identificavel = {
  id: number;
};

function dizerOi(entidade: Pessoa & Identificavel) {
  console.log(entidade.nome, entidade.id);
}

const jose = {
  nome: 'José',
  idade: 25,
  id: 1
};
dizerOi(jose);
```

Um uso interessante da tipagem no TS é a definição de tuplas. JavaScript não conta com tuplas, mas com TypeScript é possível utilizá-las (por baixo dos panos elas são transformadas em arrays).

Veja o seguinte exemplo, combinando tuplas com destruturação para retornar vários valores de uma função, de modo limpo:

```ts
type Pessoa = {
  nome: string;
  idade: number;
};

type Pais = [Pessoa, Pessoa];

function buscarPais(filho: Pessoa): Pais {
  const mae: Pessoa = { nome: 'Maria', idade: 100 };
  const pai: Pessoa = { nome: 'Carlos', idade: 100 };
  return [ mae, pai ];
}

const [ maeDoJose, paiDoJose ] = buscarPais({ nome: 'José', idade: 50 });
console.log(maeDoJose, paiDoJose);
```

## Interfaces

Interfaces e tipos são bem parecidos, na maioria dos casos funcionam da mesma forma. A comunidade TypeScript recomenda o uso de interfaces ao invés de tipos, por conta da legibilidade das mensagens de erro e do código, principalmente.

Veja um exemplo:

```ts
interface Ligavel {
  ligar(): void;
  isLigado(): boolean;
}

type HoraMinuto = {
  hora: number;
  minuto: number;
}

interface Relogio extends Ligavel {
  tick(): void;
  getHoraAtual(): HoraMinuto;
}

const naoEhUmRelogio = {
  nome: 'José',
  idade: 25
};

const relogio: Relogio = naoEhUmRelogio;
```

Veja a diferença nas mensagens se usar a definição de tipos ao invés de interfaces:

```ts
type Ligavel = {
  ligar(): void;
  isLigado(): boolean;
}

type HoraMinuto = {
  hora: number;
  minuto: number;
}

type Relogio =
  Ligavel
  & {
    tick(): void;
    getHoraAtual(): HoraMinuto;
  };

const naoEhUmRelogio = {
  nome: 'José',
  idade: 25
};

const relogio: Relogio = naoEhUmRelogio;
```

## Generics

TypeScript oferece Generics, como outras linguagens. Veja um exemplo:

```ts
interface CaixaDeSelecao<T> {
  setOpcoes(opcoes: T[]): void;
  onSelecionado(item: T): void;
  selecionar(item: T): void;
}
```

Generics também podem ser utilizado em funções:

```ts

function reduzir<T>(elementos: T[], redutor: (a: T, b: T) => T, identidade: T): T {
  let resultado = identidade;
  for (const el of elementos) {
    resultado = redutor(resultado, el);
  }
  return resultado;
}

const somador = (a: number, b: number) => a + b;
const concatenador = (a: string, b: string) => a + b;

const x = reduzir([1, 2, 3], somador, 0);
const y = reduzir(['Marcos', 'Silva'], concatenador, '');

console.log(x, y);
```

## Classes

TypeScript oferece sintaxe para classes. Veja como utilizá-las:

```ts
class Pessoa {
  nome: string;
  idade: number;

  constructor(nome: string, idade: number) {
    this.nome = nome;
    this.idade = idade;
  }
}

const jose = new Pessoa('José', 25);
console.log(jose);
```

## Controle de fluxo

Uma parte importante do benefício e uso do TypeScript está no controle de fluxo. Isso se refere à habilidade do compilador inferir mudanças no tipo dentro de um bloco de código. Veja os exemplos abaixo:

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

imprimir(['abc', 'def']);
imprimir('ghi');
```

Um uso comum para esta funcionalidade é a combinação com tipos discriminados. Veja o exemplo:

```ts
type ListaAssincrona<T> =
  | { status: 'carregando' }
  | { status: 'carregada', dados: T[] };

function renderizarLista<T>(lista: ListaAssincrona<T>, renderizadorDeItem: (item: T) => string) {
  if (lista.status === 'carregando') {
    return '...';
  } else {
    return lista.dados.map(renderizadorDeItem);
  }
}

type Pessoa = { nome: string };

function renderizarPessoa (pessoa: Pessoa) {
  return `Nome: ${pessoa.nome}`;
}

const lista1: ListaAssincrona<Pessoa> = { status: 'carregando' };

const jose = { nome: 'José' };
const maria = { nome: 'Maria' };
const lista2: ListaAssincrona<Pessoa> = { status: 'carregada', dados: [ jose, maria ] };

console.log(renderizarLista(lista1, renderizarPessoa));
console.log(renderizarLista(lista2, renderizarPessoa));
```
