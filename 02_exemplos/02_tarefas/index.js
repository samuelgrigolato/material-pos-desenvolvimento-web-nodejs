const express = require('express');
const app = express();

const tarefasRouter = require('./tarefas/tarefas-router');


app.use(express.json());
app.use('/tarefas', tarefasRouter);

app.listen(3000);
