const express = require('express');
const router = express.Router();

const modelo = require('./tarefas-modelo');


router.get('/', (req, res) => {
    res.send(modelo.listar(req.query.filtro));
});

router.get('/:id', (req, res) => {
    res.send(modelo.buscarPorId(req.params.id));
});

router.post('/', (req, res) => {
    const body = req.body;
    const tarefa = new modelo.Tarefa(body.descricao, body.previsao);
    modelo.cadastrar(tarefa);
    res.send();
});

module.exports = router;
