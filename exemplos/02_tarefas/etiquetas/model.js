import { DadosOuEstadoInvalido } from '../erros.js';
import knex from '../querybuilder.js';

export async function cadastrarEtiquetaSeNecessario (descricao, uow) {
  let res = await knex('etiquetas')
    .transacting(uow)
    .select('id')
    .where('descricao', descricao);
  if (res.length === 0) {
    res = await knex('etiquetas')
      .transacting(uow)
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

export async function removerEtiquetaSeObsoleta (idEtiqueta, uow) {
  const res = await knex('tarefa_etiqueta')
    .transacting(uow)
    .count('id_tarefa')
    .where('id_etiqueta', idEtiqueta);
  if (parseInt(res[0].count) === 0) {
    await knex('etiquetas')
      .transacting(uow)
      .delete()
      .where('id', idEtiqueta);
  }
}

export async function buscarIdEtiquetaPelaDescricao (descricao, uow) {
  const res = await knex('etiquetas')
    .transacting(uow)
    .select('id')
    .where('descricao', descricao);
  if (res.length === 0) {
    throw new DadosOuEstadoInvalido('EtiquetaNaoExiste', 'Etiqueta não existe.');
  }
  return res[0].id;
}

export async function buscarEtiquetas (uow) {
  return await knex('etiquetas')
    .transacting(uow)
    .select('descricao', 'cor');
}

function gerarCorAleatoria () {
  const num = Math.round(0xffffff * Math.random());
  const r = num >> 16;
  const g = num >> 8 & 255;
  const b = num & 255;
  return `rgb(${r}, ${g}, ${b})`;
}
