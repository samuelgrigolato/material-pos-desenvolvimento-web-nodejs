const express = require('express');
const tarefasService = require('./tarefas-service');


const router = express.Router();

router.get('/', async (req, res) => {
    const usuario = req.user.sub;
    try {
        const tarefas = await tarefasService.listar(usuario);
        res.send(tarefas.map(tarefa => ({
            id: tarefa.id,
            descricao: tarefa.descricao,
            previsao: tarefa.previsao,
            conclusao: tarefa.conclusao
        })));
    } catch (err) {
        console.error(err);
        res.status(500).send();
    }
});

router.get('/:id', async (req, res) => {
    const usuario = req.user.sub;
    const id = req.params.id;
    try {
        const tarefa = await tarefasService.buscarPorId(id);
        if (!tarefa) {
            res.status(404).send();
        } else if (tarefa.usuario.login !== usuario) {
            res.status(403).send();
        } else {
            res.send({
                id: tarefa.id,
                descricao: tarefa.descricao,
                previsao: tarefa.previsao,
                conclusao: tarefa.conclusao
            });
        }
    } catch (err) {
        console.error(err);
        res.status(500).send();
    }
});

router.post('/', async (req, res) => {
    const usuario = req.user.sub;
    const tarefa = req.body;
    try {
        const id = await tarefasService.cadastrar(tarefa, usuario);
        res.send({ id });
    } catch (err) {
        console.error(err);
        res.status(500).send();
    }
});

module.exports = router;
