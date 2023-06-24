import cluster from 'cluster';
import http from 'http';

const WORKER_COUNT = 2;


if (cluster.isPrimary) {

  console.log('Primary');

  const workers = [];
  for (let i = 0; i < WORKER_COUNT; i++) {
    workers.push(cluster.fork({
      WORKER_ID: i
    }));
  }

} else {

  const wid = process.env.WORKER_ID;

  console.log(`Worker #${wid}`);

  const server = http.createServer(function (req, resp) {
    console.log(`W#${wid}: processando`);
    // essa versão dá pouca diferença, mesmo
    // com um único worker, pois o event loop
    // não fica travado
    // setTimeout(function () {
    //   resp.write('Olá!');
    //   resp.end();
    // }, Math.random() * 3000 + 1000);
    // essa versão apresenta uma diferença
    // muito grande! pois o código síncrono
    // trava o event loop de 1 único worker
    if (Math.floor(Math.random() * 2) === 0.0) {
      for (let i = 0; i < 5000000000; i++) {};
    }
    resp.write('Olá!');
    resp.end();
  });

  server.listen(8080);

}
