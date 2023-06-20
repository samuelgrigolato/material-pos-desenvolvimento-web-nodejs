
// function ContaBancaria(saldo) {
//   this.saldo = saldo;
// }
// ContaBancaria.prototype.sacar = function (valor) {
//   this.saldo -= valor;
// }
class ContaBancaria {
  constructor(saldo) {
    this.saldo = saldo;
  }
  sacar(valor) {
    this.saldo -= valor;
  }
}

const conta1 = new ContaBancaria(100);
console.log(conta1.saldo);
conta1.sacar(25);
console.log(conta1.saldo);

// function ContaInvestimento(saldo, taxaRendimento) {
//   ContaBancaria.call(this, saldo);
//   this.taxaRendimento = taxaRendimento;
// }
// Object.setPrototypeOf(ContaInvestimento.prototype, ContaBancaria.prototype);
// ContaInvestimento.prototype.virarMes = function () {
//   this.saldo += this.saldo * this.taxaRendimento;
// }
class ContaInvestimento extends ContaBancaria {
  constructor(saldo, taxaRendimento) {
    super(saldo);
    this.taxaRendimento = taxaRendimento;
  }
  virarMes() {
    this.saldo += this.saldo * this.taxaRendimento;
  }
}

const conta2 = new ContaInvestimento(100, 0.1);
console.log(conta2.saldo);
conta2.virarMes();
console.log(conta2.saldo);
conta2.sacar(50);
console.log(conta2.saldo);
