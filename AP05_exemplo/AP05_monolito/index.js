const express = require('express');
const formidable = require('express-formidable');
const cotacaoService = require('./cotacao/cotacao.service');


const app = express();


app.use(formidable());
app.use(express.static(`${__dirname}/public`));


app.post('/cotacao', async (req, res) => {
    try {
        await cotacaoService.cotar(req.fields);
        res.status(204).send();
    } catch (err) {
        console.log(err);
        if (err.dadosInvalidos) {
            res.status(400).send();
        } else {
            res.status(500).send();
        }
    }
});


app.listen(3000);
