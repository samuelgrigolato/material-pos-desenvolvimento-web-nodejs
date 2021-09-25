import express from 'express';
import Ajv from 'ajv';

import asyncWrapper from '../async-wrapper.js';
import autenticado from '../autenticado.js';
import { alterarNome, autenticar } from './model.js';
import { DadosOuEstadoInvalido } from '../erros.js';


const router = express.Router();

const ajv = new Ajv({
  allErrors: true
});
const loginSchema = {
  type: 'object',
  properties: {
    login: { type: 'string' },
    senha: { type: 'string' }
  },
  required: [ 'login', 'senha' ],
  additionalProperties: false
};
const loginSchemaValidator = ajv.compile(loginSchema);

router.post('/login', asyncWrapper(async (req, res) => {
  if (!loginSchemaValidator(req.body)) {
    const errors = loginSchemaValidator.errors;
    throw new DadosOuEstadoInvalido('FalhouValidacaoEsquema', ajv.errorsText(errors), errors);
  }
  const { login, senha } = req.body;
  const autenticacao = await autenticar(login, senha);
  res.send({ token: autenticacao });
}));

router.get('/logado', autenticado, asyncWrapper(async (req, res) => {
  res.send({
    nome: req.usuario.nome
  });
}));

router.put('/logado/nome', autenticado, asyncWrapper(async (req, res) => {
  const novoNome = req.body.valor;
  await alterarNome(novoNome, req.usuario.login);
  res.sendStatus(204);
}));


export default router;
