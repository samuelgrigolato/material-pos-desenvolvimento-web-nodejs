var Pessoa = /** @class */ (function () {
    function Pessoa(nome, idade) {
        this.nome = nome;
        this.idade = idade;
    }
    return Pessoa;
}());
var jose = new Pessoa('José', 25);
console.log(jose);
