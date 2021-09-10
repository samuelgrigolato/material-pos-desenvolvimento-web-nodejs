import Ajv from 'ajv';

import { DadosOuEstadoInvalido } from './erros.js';

const ajv = new Ajv({
  removeAdditional: true,
  allErrors: true
});

export default schema => {
  const validator = ajv.compile(schema);
  return (req, _res, next) => {
    if (!validator(req.body)) {
      const errors = validator.errors;
      throw new DadosOuEstadoInvalido('FalhouValidacaoEsquema', ajv.errorsText(errors), errors);
    }
    next();
  };
};
