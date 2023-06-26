
function reduzir<T>(elementos: T[], redutor: (a: T, b: T) => T, identidade: T): T {
  let resultado = identidade;
  for (const el of elementos) {
    resultado = redutor(resultado, el);
  }
  return resultado;
}

const somador = (a: number, b: number) => a + b;
const concatenador = (a: string, b: string) => a + b;

const x = reduzir([1, 2, 3], somador, 0);
const y = reduzir(['Marcos', 'Silva'], concatenador, '');

console.log(x, y);
