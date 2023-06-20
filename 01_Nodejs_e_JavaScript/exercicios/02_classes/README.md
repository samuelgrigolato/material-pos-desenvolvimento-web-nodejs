# Proposta de exercício: Classes

Implemente, usando prototypes e classes, a seguinte estrutura:

- Conta bancária: atributo `saldo` inicializado pelo construtor, função `sacar` (não é necessário tratar se existe saldo).
- Conta investimento: estende a `Conta bancária` recebendo um atributo adicional chamado `rendimentoMensal`. Ganha um método `virarMes` que aplica a taxa de rendimento no saldo atual.

## Dicas

- use a função `Object.setPrototypeOf(B.prototype, A.prototype)` para simular o `extends`. Use `B.call(this, param1, param2)` para simular o `super(param1, param2)`.
