
async function aguardar (segundos) {
  console.log('aguardando...');
  return new Promise(resolve => {
    setTimeout(resolve, segundos * 1000);
  });
}

async function gerarAteMaior8 () {
  let res = 0;
  let aleatorio;
  do {
    await aguardar(3);
    aleatorio = Math.ceil(Math.random() * 10);
    console.log('gerou', aleatorio);
    if (aleatorio < 8) {
      res += aleatorio;
      console.log('parcial', res);
    }
  } while (aleatorio < 8);
  return res;
}

function gerarAteMaior8SemAsync () {
  return new Promise(resolve => {
    let res = 0;
    function gerar () {
      console.log('aguardando...');
      setTimeout(function () {
        const aleatorio = Math.ceil(Math.random() * 10);
        console.log('gerou', aleatorio);
        if (aleatorio < 8) {
          res += aleatorio;
          console.log('parcial', res);
          gerar();
        } else {
          resolve(res);
        }
      }, 3000);
    }
    gerar();
  });
}
