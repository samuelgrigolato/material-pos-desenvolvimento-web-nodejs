const express = require('express');
const tarefasService = require('./tarefas-service');


const router = express.Router();

router.get('/', async (req, res) => {
    const usuario = req.user.sub;
    const tarefas = await tarefasService.listar(usuario);
    res.send(tarefas.map(tarefa => ({
        id: tarefa.id,
        descricao: tarefa.descricao,
        previsao: tarefa.previsao,
        conclusao: tarefa.conclusao
    })));
});

router.get('/:id', async (req, res) => {
    const usuario = req.user.sub;
    const id = req.params.id;
    const tarefa = await tarefasService.buscarPorId(id);
    if (tarefa.usuario.login !== usuario) {
        res.status(403).send();
    } else {
        res.send({
            id: tarefa.id,
            descricao: tarefa.descricao,
            previsao: tarefa.previsao,
            conclusao: tarefa.conclusao
        });
    }
});

module.exports = router;
