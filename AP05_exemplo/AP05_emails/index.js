const express = require('express');
const emailService = require('./email/email.service');


const app = express();
app.use(express.json());


app.post('/enviar', async (req, res) => {
    try {
        const { assunto, texto, para } = req.body;
        await emailService.enviar(assunto, texto, para);
        res.status(204).send();
    } catch (err) {
        res.status(500).send();
    }
});


app.listen(3001);
