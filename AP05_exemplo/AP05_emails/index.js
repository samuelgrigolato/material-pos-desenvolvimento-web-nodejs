const express = require('express');
const amqplib = require('amqplib');
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


amqplib.connect('amqp://localhost:5672')
    .then(conn => conn.createChannel())
    .then(async ch => {
        await ch.assertQueue('emails');
        return ch.consume('emails', msg => {
            if (msg !== null) {
                const { assunto, texto, para } = JSON.parse(msg.content.toString());
                emailService.enviar(assunto, texto, para).then(() => ch.ack(msg));
            }
        });
    });


app.listen(3001);
