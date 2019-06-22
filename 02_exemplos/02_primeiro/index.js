const express = require('express');
const app = express()

app.use(express.json());

app.get('/ola', (req, res) => {
    const nome = req.query.nome;
    res.send(`Olá, ${nome}!`);
});

app.post('/pessoas/:id/telefones', (req, res) => {
    const idPessoa = req.params.id;
    const telefone = req.body;
    console.log(idPessoa);
    console.log(telefone);
    res.send();
});

app.listen(3000, () => {
    console.log('Primeira API com Express.');
});
