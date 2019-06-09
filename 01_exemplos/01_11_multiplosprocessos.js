const cluster = require('cluster');

if (cluster.isWorker) {

    cluster.worker.on('message', message => {
        let soma = 0;
        for (let i = message.inicio; i < message.fim; i++) {
            soma += i;
        }
        console.log(`Worker: ${soma}`);
        cluster.worker.send(soma);
        cluster.worker.disconnect();
    });

} else {

    let recebidos = 0;
    let soma = 0;
    cluster.on('message', (_, message) => {
        soma += message;
        recebidos++;
        if (recebidos == NUMERO_DE_PROCESSOS) {
            console.log(`Master: ${soma}`);
        }
    });

    const workers = [];
    const NUMERO_DE_PROCESSOS = 4;
    for (let i = 0; i < NUMERO_DE_PROCESSOS; i++) {
        workers.push(cluster.fork());
    }

    const TOTAL_PARCELAS = 100000000000;
    const PARCELAS_POR_PROCESSO = TOTAL_PARCELAS / NUMERO_DE_PROCESSOS;
    for (let i = 0; i < NUMERO_DE_PROCESSOS; i++) {
        workers[i].send({
            inicio: PARCELAS_POR_PROCESSO * i,
            fim: PARCELAS_POR_PROCESSO * (i + 1)
        });
    }

}
