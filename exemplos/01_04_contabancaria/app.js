
function ContaBancaria (saldo) {
  this.saldo = saldo;
}
ContaBancaria.prototype.sacar = function (valor) {
  this.saldo -= valor;
};

function ContaInvestimento(saldo, rendimentoMensal) {
  ContaBancaria.call(this, saldo);
  this.rendimentoMensal = rendimentoMensal;
}
Object.setPrototypeOf(ContaInvestimento.prototype, ContaBancaria.prototype);
ContaInvestimento.prototype.virarMes = function () {
  this.saldo += this.saldo * this.rendimentoMensal;
};

class ContaBancaria2 {
  constructor(saldo) {
    this.saldo = saldo;
  }

  sacar(valor) {
    this.saldo -= valor;
  }
}

class ContaInvestimento2 extends ContaBancaria2 {
  constructor(saldo, rendimentoMensal) {
    super(saldo);
    this.rendimentoMensal = rendimentoMensal;
  }

  virarMes() {
    this.saldo += this.saldo * this.rendimentoMensal;
  }
}
