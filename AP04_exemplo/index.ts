import express from 'express';

import { extrairNome } from './lib';


const app = express();

app.get('/', (req, res) => {
    res.send(`Olá, ${extrairNome(req) || 'anônimo'}!`);
});

app.listen(3000);
