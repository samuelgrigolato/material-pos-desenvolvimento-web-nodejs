import cluster from 'cluster';
import readline from 'readline';
import fs from 'fs';

const WORKERS = 4;

if (cluster.isPrimary) {

  let recebidos = 0;
  let total = 0;
  for (let i = 0; i < WORKERS; i++) {
    const worker = cluster.fork({ IDX: i });
    worker.on('message', parcial => {
      worker.kill();
      total += parcial;
      recebidos++;
      if (recebidos === WORKERS) {
        console.log('total', total);
      }
    });
  }

} else {

  const idx = parseInt(process.env.IDX);
  console.log(`worker ${idx}...`)

  const readStream = fs.createReadStream('resultado.txt');
  const lineReader = readline.createInterface(readStream);

  let parcial = 0;
  let indiceDaLinha = 0;
  for await (const linha of lineReader) {
    if (linha !== "") {
      if (indiceDaLinha % WORKERS === idx) {
        const numero = parseInt(linha);
        if (numero % 2 === 0) {
          parcial += 1;
        }
      }
    }
    indiceDaLinha++;
  }

  console.log('parcial', idx, parcial);
  cluster.worker.send(parcial);

}
