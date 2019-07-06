const express = require('express');
const jsonwebtoken = require('jsonwebtoken');
const moment = require('moment');
const loginService = require('./login-service');
const { SEGREDO_JWT } = require('../seguranca');


const router = express.Router();

router.post('/', (req, res) => {
    const { usuario, senha } = req.body;
    loginService.credenciaisValidas(usuario, senha)
        .then(() => {
            const token = jsonwebtoken.sign({
                sub: usuario,
                exp: moment().add(30, 'minutes').unix()
            }, SEGREDO_JWT);
            res.send({ token });
        })
        .catch(err => {
            console.error(err);
            res.status(500).send();
        });
});

module.exports = router;
