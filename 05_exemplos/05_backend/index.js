const express = require('express');
const cors = require('cors');
const apicache = require('apicache');


const app = express();
const cache = apicache
    .middleware;


app.use(cors());


app.get('/nomes', cache('10 seconds'), (_, res) => {
    console.log('Executando a busca de nomes real...');
    setTimeout(() => {
        // res.header('Cache-Control', 'public, max-age=10');
        res.send([ 'Pessoa 1', 'Pessoa 2', 'Pessoa 3' ]);
    }, 3000);
});


app.listen(3000);
