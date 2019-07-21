const express = require('express');
const session = require('express-session');


const app = express();


app.use(express.json());
app.use(session({
    secret: 'umsegredo',
    resave: false,
    saveUninitialized: false
}));


app.get('/carrinho/itens', (req, res) => {
    const itens = req.session.itens || [];
    res.send(itens);
});


app.post('/carrinho/itens', (req, res) => {
    if (!req.session.itens) {
        req.session.itens = [];
    }
    req.session.itens.push(req.body);
    res.status(201).send();
});


app.listen(3000);
