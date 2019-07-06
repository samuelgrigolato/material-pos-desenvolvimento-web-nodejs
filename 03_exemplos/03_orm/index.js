const express = require('express');
const jwt = require('express-jwt');
const { SEGREDO_JWT } = require('./seguranca');
const loginRouter = require('./login/login-router');
const tarefasRouter = require('./tarefas/tarefas-router');

const app = express();

app.use(express.json());

app.use(jwt({
    secret: SEGREDO_JWT
}).unless({ path: '/login' }));

app.use('/login', loginRouter);
app.use('/tarefas', tarefasRouter);

app.listen(3000);
