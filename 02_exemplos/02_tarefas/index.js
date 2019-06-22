const express = require('express');
const basicAuth = require('express-basic-auth');
const app = express();

const tarefasRouter = require('./tarefas/tarefas-router');

app.use(basicAuth({
    users: {
        'samuel': '123',
        'admin': '234'
    },
    realm: 'tarefas',
    challenge: true
}));

app.use((req, res, next) => {
    console.log(req.auth);
    next();
});

app.use(express.json());
app.use('/tarefas', tarefasRouter);

app.listen(3000);
