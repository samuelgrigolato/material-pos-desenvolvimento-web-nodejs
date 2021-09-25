import express from 'express';

import asyncWrapper from '../async-wrapper.js';
import schemaValidator from '../schema-validator.js';
import autenticado from '../autenticado.js';
import { alterarNome, autenticar } from './model.js';


const router = express.Router();


router.post(
  '/login',
  schemaValidator({
    type: 'object',
    properties: {
      login: { type: 'string' },
      senha: { type: 'string' }
    },
    required: [ 'login', 'senha' ],
    additionalProperties: false
  }),
  asyncWrapper(async (req, res) => {
    const { login, senha } = req.body;
    const autenticacao = await autenticar(login, senha);
    res.send({ token: autenticacao });
  })
);

router.get('/logado', autenticado, asyncWrapper(async (req, res) => {
  res.send({
    nome: req.usuario.nome
  });
}));

router.put(
  '/logado/nome',
  autenticado,
  schemaValidator({
    type: 'object',
    properties: {
      valor: { type: 'string' }
    },
    required: [ 'valor' ],
    additionalProperties: false
  }),
  asyncWrapper(async (req, res) => {
    const novoNome = req.body.valor;
    await alterarNome(novoNome, req.usuario.login);
    res.sendStatus(204);
  }
));


export default router;
