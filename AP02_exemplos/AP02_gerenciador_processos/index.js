const express = require('express');
const app = express();
app.get('/', (req, res) => {
    let soma = 0;
    for (let i = 1; i < 1000000000; i++) {
        soma += i;
    }
    res.send(`Resposta ${soma}.`);
});
app.listen(3001);
