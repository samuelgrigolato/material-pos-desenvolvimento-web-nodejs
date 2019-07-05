const express = require('express');
const cluster = require('express-cluster');


cluster(worker => {

    console.log(`Iniciando worker ${worker.id}`);

    const app = express();
    app.get('/', (req, res) => {
        let soma = 0;
        for (let i = 1; i < 1000000000; i++) {
            soma += i;
        }
        res.send(`Resposta ${soma} gerada pelo worker ${worker.id}.`);
    });

    app.listen(3000);

}, { count: 3 });
