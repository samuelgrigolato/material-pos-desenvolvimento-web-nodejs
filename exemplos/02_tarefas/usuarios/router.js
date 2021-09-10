import express from 'express';

import asyncWrapper from '../async-wrapper.js';
import schemaValidator from '../schema-validator.js';
import { DadosOuEstadoInvalido } from '../erros.js';
import { alterarNomeDoUsuario, autenticar, recuperarDadosDoUsuario } from './model.js';

const router = express.Router();

const loginSchema = {
  type: 'object',
  properties: {
    login: { type: 'string' },
    senha: { type: 'string' }
  },
  required: [ 'login', 'senha' ]
};

router.post('/login', schemaValidator(loginSchema), asyncWrapper(async (req, res) => {
  const { login, senha } = req.body; // lembre-se do middleware express.json
  const autenticacao = await autenticar(login, senha);
  res.send({ autenticacao });
}));

router.get('/logado', asyncWrapper(async (req, res) => {
  const usuario = await recuperarDadosDoUsuario(req.loginDoUsuario);
  res.send(usuario);
}));

const nomeSchema = {
  type: 'object',
  properties: {
    nome: { type: 'string' }
  },
  required: [ 'nome' ]
};

router.put('/logado/nome', schemaValidator(nomeSchema), asyncWrapper(async (req, res) => {
  await alterarNomeDoUsuario(req.body.nome, req.loginDoUsuario);
  res.sendStatus(204);
}));

export default router;
