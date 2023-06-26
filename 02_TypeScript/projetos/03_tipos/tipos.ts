
// const nome: any = 'José';
// console.log(nome);

// function dizerOi(nome: string) {
//   console.log(`Olá, ${nome}!`);
// }

// dizerOi('José');
// // dizerOi(5);

// function duplicar(valor: number) {
//   return valor * 2;
// }

// const x = duplicar(5);

// type Pessoa = {
//   nome: string;
//   idade: number;
// }

// function ehMaiorDeIdade(pessoa: Pessoa): boolean {
//   return pessoa.idade >= 18;
// }

// const jose = {
//   nome: 'José',
//   idade: 25
// };

// console.log(ehMaiorDeIdade(jose), jose.nome);

// type Pessoa = {
//   nome: string;
//   idade: number;
// }

// function ehMaiorDeIdade(pessoaOuIdade: Pessoa | number): boolean {
//   let idade: number;
//   if (typeof pessoaOuIdade === 'number') {
//     idade = pessoaOuIdade;
//   } else {
//     idade = pessoaOuIdade.idade;
//   }
//   return idade >= 18;
// }

// const jose = {
//   nome: 'José',
//   idade: 25
// };

// console.log(ehMaiorDeIdade(jose), jose.nome);
// console.log(ehMaiorDeIdade(5));

// type Pessoa = {
//   nome: string;
//   idade: number;
// };

// type Identificavel = {
//   id: number;
// };

// function dizerOi(entidade: Pessoa & Identificavel) {
//   console.log(entidade.nome, entidade.id);
// }

// const jose = {
//   nome: 'José',
//   idade: 25,
//   id: 1
// };
// dizerOi(jose);

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
