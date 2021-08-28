
function repetir(vezes, elemento) {
  const res = [];
  for (let i = 0; i < vezes; i++) {
    res.push(elemento);
  }
  return res;
}

const repetir10 = repetir.bind(null, 10);

function* repetirInfinitamente(elemento) {
  while (true) {
    yield elemento;
  }
}

function* intercalarInfinitamente(e1, e2) {
  let proximo = e1;
  while (true) {
    yield proximo;
    proximo = proximo === e1 ? e2 : e1;
  }
}
