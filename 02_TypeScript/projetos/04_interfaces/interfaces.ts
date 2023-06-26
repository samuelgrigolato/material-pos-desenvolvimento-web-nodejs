
// interface Ligavel {
//   ligar(): void;
//   isLigado(): boolean;
// }

// type HoraMinuto = {
//   hora: number;
//   minuto: number;
// }

// interface Relogio extends Ligavel {
//   tick(): void;
//   getHoraAtual(): HoraMinuto;
// }

// const naoEhUmRelogio = {
//   nome: 'José',
//   idade: 25
// };

// const relogio: Relogio = naoEhUmRelogio;

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
  idade: 25,
};

const relogio: Relogio = naoEhUmRelogio;
