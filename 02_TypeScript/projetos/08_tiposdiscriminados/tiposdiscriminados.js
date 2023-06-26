function renderizarLista(lista, renderizadorDeItem) {
    if (lista.status === 'carregando') {
        return '...';
    }
    else {
        return lista.dados.map(renderizadorDeItem);
    }
}
function renderizarPessoa(pessoa) {
    return "Nome: ".concat(pessoa.nome);
}
var lista1 = { status: 'carregando' };
var jose = { nome: 'José' };
var maria = { nome: 'Maria' };
var lista2 = { status: 'carregada', dados: [jose, maria] };
console.log(renderizarLista(lista1, renderizarPessoa));
console.log(renderizarLista(lista2, renderizarPessoa));
