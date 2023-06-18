const { Worker, isMainThread, workerData, parentPort } = require('worker_threads');
const readline = require('readline');

// const WORKERS = 1;
const WORKERS = 6;

if (isMainThread) {

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  rl.question('Digite um número: ', function (linha) {
    const numero = parseInt(linha);

    let somaTotal = 0;
    let respostasRecebidas = 0;

    const parcela = Math.floor(numero / WORKERS);
    for (let i = 0; i < WORKERS; i++) {
      const worker = new Worker(__filename, {
        workerData: {
          inicio: parcela * i,
          // garante que a última parcela vai até o número informado + 1
          fim: i === WORKERS - 1 ? numero + 1 : parcela * (i + 1),
          i
        }
      });
      worker.on('message', function (somaParcial) {
        somaTotal += somaParcial;
        respostasRecebidas++;
        if (respostasRecebidas === WORKERS) {
          console.log(`Soma total: ${somaTotal}`);
        }
      });
    }

    rl.close();
  });

} else {
  console.log(`worker #${workerData.i}... inicio=${workerData.inicio} fim=${workerData.fim}`);
  let somaParcial = 0;
  for (let i = workerData.inicio; i < workerData.fim; i++) {
    somaParcial += i;
  }
  parentPort.postMessage(somaParcial);
}
