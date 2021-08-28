const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');

const WORKERS = 4;

if (isMainThread) {
  const numero = parseInt(process.argv[2]);
  let res = 0;
  let resCount = 0;
  for (let i = 0; i < WORKERS; i++) {
    const w = new Worker(__filename, { workerData: { numero, i } });
    w.addListener("message", function (partialRes) {
      res += partialRes;
      resCount += 1;
      if (resCount === WORKERS) {
        console.log(res);
      }
    });
  }
} else {
  console.log(`worker ${workerData.i}...`);
  const numero = workerData.numero;
  let res = 0;
  const lote = 10000 / WORKERS;
  for (let i = workerData.i * lote + 1; i <= (workerData.i + 1) * lote; i++) {
    if (i % numero === 0) {
      res += i;
    }
  }
  parentPort.postMessage(res);
}
