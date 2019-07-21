const express = require('express');
const cors = require('cors');
//const apicache = require('apicache');
const memoizee = require('memoizee');


const app = express();
// const cache = apicache.middleware;


app.use(cors());


app.get('/nomes'/*, cache('10 seconds')*/, (_, res) => {
    getNomes().then(nomes => {
        res.send(nomes);
    });
});

const getNomes = memoizee(() => {
    return new Promise((resolve, _) => {
        console.log('Executando a busca de nomes real...');
        setTimeout(() => {
            resolve([ 'Pessoa 1', 'Pessoa 2', 'Pessoa 3' ]);
        }, 3000);
    });
}, { maxAge: 10000, promise: true });


app.listen(3000);
