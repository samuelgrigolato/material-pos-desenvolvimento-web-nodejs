const express = require('express');
const cors = require('cors');


const app = express();


app.use(cors());


app.get('/nomes', (_, res) => {
    setTimeout(() => {
        res.send([ 'Pessoa 1', 'Pessoa 2', 'Pessoa 3' ]);
    }, 3000);
});


app.listen(3000);
