
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
