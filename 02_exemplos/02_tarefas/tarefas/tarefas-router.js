const express = require('express');
const { checkSchema, validationResult } = require('express-validator');
const router = express.Router();

const modelo = require('./tarefas-modelo');


router.get('/', (req, res) => {
    res.send(modelo.listar(req.query.filtro));
});

router.get('/:id', (req, res) => {
    res.send(modelo.buscarPorId(req.params.id));
});

router.post('/',
    checkSchema({
        descricao: {
            in: 'body',
            errorMessage: 'Deve ser um valor entre 3 e 100 caracteres.',
            isLength: {
                options: {
                    min: 3,
                    max: 100
                }
            }
        },
        previsao: {
            in: 'body',
            errorMessage: 'Deve ser uma data válida.',
            toDate: true,
            isEmpty: {
                negated: true
            }
        }
    }),
    (req, res) => {

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ errors: errors.array() });
            return;
        }

        const body = req.body;
        const previsao = body.previsao.toISOString();
        const tarefa = new modelo.Tarefa(body.descricao, previsao);
        modelo.cadastrar(tarefa);
        res.send();
    });

module.exports = router;
