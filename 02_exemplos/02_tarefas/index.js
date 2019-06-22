const express = require('express');
const jwt = require('express-jwt');
const jsonwebtoken = require('jsonwebtoken');
const app = express();

const tarefasRouter = require('./tarefas/tarefas-router');

app.use(jwt({
    secret: 'tarefasjwtsecret'
}).unless({ path: '/login' }));

app.use((req, res, next) => {
    console.log(req.user);
    next();
});

app.use(express.json());

app.post('/login', (req, res) => {
    const { user, pass } = req.body;
    if (!user || !pass) {
        res.status(400).send('Informe o usuário e a senha.');
    } else if (user !== 'samuel' && pass !== '123') {
        res.status(400).send('Credenciais inválidas.');
    } else {
        const token = jsonwebtoken.sign({
            sub: user,
            exp: new Date(2015, 1, 1, 10, 30, 0).getTime() / 1000
        }, 'tarefasjwtsecret');
        res.send(token);
    }
});

app.use('/tarefas', tarefasRouter);

app.listen(3000);
