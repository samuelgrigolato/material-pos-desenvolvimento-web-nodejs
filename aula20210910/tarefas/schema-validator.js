import Ajv from 'ajv';

import { DadosOuEstadoInvalido } from './erros.js';


const ajv = new Ajv({
  allErrors: true
});


export default (jsonSchema) => {
  const validator = ajv.compile(jsonSchema);
  return (req, _res, next) => {
    if (!validator(req.body)) {
      const errors = validator.errors;
      throw new DadosOuEstadoInvalido('FalhouValidacaoEsquema', ajv.errorsText(errors), errors);
    }
    next();
  };
}
