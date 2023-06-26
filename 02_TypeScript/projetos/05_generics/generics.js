function reduzir(elementos, redutor, identidade) {
    var resultado = identidade;
    for (var _i = 0, elementos_1 = elementos; _i < elementos_1.length; _i++) {
        var el = elementos_1[_i];
        resultado = redutor(resultado, el);
    }
    return resultado;
}
var somador = function (a, b) { return a + b; };
var concatenador = function (a, b) { return a + b; };
var x = reduzir([1, 2, 3], somador, 0);
var y = reduzir(['Marcos', 'Silva'], concatenador, '');
console.log(x, y);
