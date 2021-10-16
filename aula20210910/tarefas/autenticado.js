import { UsuarioNaoAutenticado } from './erros.js';

export default function (req, _res, next) {
  if (req.usuario === undefined) {
    throw new UsuarioNaoAutenticado();
  }
  next();
}
