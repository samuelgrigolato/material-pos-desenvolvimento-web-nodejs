import knex from '../querybuilder.js';

export async function buscarEtiquetas () {
  return await knex('etiquetas')
    .select('descricao', 'cor');
}

export async function cadastrarEtiquetaSeNecessario (descricao, trx) {
  let res = await trx('etiquetas')
    .select('id')
    .where('descricao', descricao);
  if (res.length === 0) {
    res = await trx('etiquetas')
      .insert({
        descricao,
        cor: gerarCorAleatoria()
      })
      .returning('id');
    return res[0];
  } else {
    return res[0].id;
  }
}

function gerarCorAleatoria () {
  const num = Math.round(0xffffff * Math.random());
  const r = num >> 16;
  const g = num >> 8 & 255;
  const b = num & 255;
  return `rgb(${r}, ${g}, ${b})`;
}
