import { Knex } from 'knex';

import { DadosOuEstadoInvalido } from '../shared/erros';


type FatorRGB = number; // 0-255
type Cor = [FatorRGB, FatorRGB, FatorRGB];

type Etiqueta = {
  id: number;
  descricao: string;
  cor: Cor;
}

declare module 'knex/types/tables' {
  interface Tables {
    etiquetas: Etiqueta;
  }
}

export async function buscarEtiquetas(
  uow: Knex
): Promise<Pick<Etiqueta, 'descricao' | 'cor'>[]> {
  return await uow('etiquetas')
    .select('descricao', 'cor');
}

export async function buscarIdDaEtiquetaPelaDescricao(
  descricao: string, uow: Knex
): Promise<number> {
  const res = await uow('etiquetas')
    .select('id')
    .where('descricao', descricao)
    .first();
  if (res === undefined) {
    throw new DadosOuEstadoInvalido('Etiqueta não encontrada', {
      codigo: 'ETIQUETA_NAO_ENCONTRADA'
    });
  }
  return res.id;
}

export async function removerEtiquetaSeObsoleta(
  id: number, uow: Knex
): Promise<void> {
  // pequena dependência circular aqui
  // visto que o conceito de etiquetas
  // está dependendo do conceito de tarefas
  const res = await uow('tarefa_etiqueta')
    .count('id_tarefa')
    .where('id_etiqueta', id)
    .first();
  // infelizmente esse count é uma string e não um number
  if (res === undefined || res.count === '0') {
    await uow('etiquetas')
      .where('id', id)
      .delete();
  }
}

export async function cadastrarEtiquetaSeNecessario(
  etiqueta: string, uow: Knex
): Promise<number> {
  const res = await uow('etiquetas')
    .select('id')
    .where('descricao', etiqueta)
    .first();
  let id: number;
  if (res !== undefined) {
    id = res.id;
  } else {
    const res = await uow('etiquetas')
      .insert({
        descricao: etiqueta,
        cor: gerarCorAleatoria()
      })
      .returning<{ id: number }[]>('id');
    id = res[0].id;
  }
  return id;
}

function gerarCorAleatoria(): Cor {
  const num = Math.round(0xffffff * Math.random());
  const r = num >> 16;
  const g = num >> 8 & 255;
  const b = num & 255;
  return [r, g, b];
}
