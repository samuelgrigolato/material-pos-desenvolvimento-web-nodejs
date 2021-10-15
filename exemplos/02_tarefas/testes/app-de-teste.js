import express from 'express';
import comTransacaoDeTeste from './transacao-de-teste';
import setupApp from '../setup-app';

export default (callback) => {
  return comTransacaoDeTeste(async (trx) => {
    const appDeTeste = express();
    appDeTeste.use(function (req, _res, next) {
      req.uow = trx;
      next();
    });
    setupApp(appDeTeste);
    await callback(appDeTeste, trx);
  });
};
