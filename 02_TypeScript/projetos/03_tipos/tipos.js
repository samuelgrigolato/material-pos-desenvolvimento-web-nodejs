// const nome: any = 'José';
// console.log(nome);
function buscarPais(filho) {
    var mae = { nome: 'Maria', idade: 100 };
    var pai = { nome: 'Carlos', idade: 100 };
    return [mae, pai];
}
var _a = buscarPais({ nome: 'José', idade: 50 }), maeDoJose = _a[0], paiDoJose = _a[1];
console.log(maeDoJose, paiDoJose);
