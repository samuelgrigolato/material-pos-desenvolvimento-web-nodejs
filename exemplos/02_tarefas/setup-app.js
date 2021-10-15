import express from 'express';
import cors from 'cors';
import fileUpload from 'express-fileupload';

import asyncWrapper from './async-wrapper.js';
import { recuperarLoginDoUsuarioAutenticado } from './usuarios/model.js';
import usuariosRouter from './usuarios/router.js';
import tarefasRouter from './tarefas/router.js';
import etiquetasRouter from './etiquetas/router.js';
import categoriasRouter from './categorias/router.js';

export default app => {
  app.use(cors());
  app.use(express.json());
  app.use(fileUpload({
    debug: true,
    //useTempFiles: false,
    //abortOnLimit: false,
    limits: {
      fileSize: 50 * 1024 * 1024 // 50mb
    }
  }));
  
  app.use((req, _res, next) => {
    const contentType = req.headers['content-type'];
    if (contentType !== undefined &&
        !contentType.startsWith('application/json') &&
        !contentType.startsWith('multipart/form-data')) {
      next({
        statusCode: 400,
        message: 'Corpo da requisição deve ser application/json ou multipart/form-data'
      });
    } else {
      next();
    }
  });
  
  app.use(asyncWrapper(async (req, _res, next) => {
    const authorization = req.headers['authorization'];
    const match = /^Bearer (.*)$/.exec(authorization);
    if (match) {
      const autenticacao = match[1];
      const loginDoUsuario = await recuperarLoginDoUsuarioAutenticado(autenticacao);
      req.loginDoUsuario = loginDoUsuario;
    }
    next();
  }));
  
  app.use('/tarefas', tarefasRouter);
  app.use('/usuarios', usuariosRouter);
  app.use('/etiquetas', etiquetasRouter);
  app.use('/categorias', categoriasRouter);
  
  app.use((_req, res) => {
    res.status(404).send({
      razao: 'Rota não existe.'
    });
  });
  
  app.use((err, _req, res, _next) => {
    let resposta;
    if (err.codigo) {
      resposta = {
        codigo: err.codigo,
        descricao: err.message,
        extra: err.extra
      };
    } else {
      resposta = {
        razao: err.message || err
      };
    }
    res.status(err.statusCode || 500).send(resposta);
  });
};
