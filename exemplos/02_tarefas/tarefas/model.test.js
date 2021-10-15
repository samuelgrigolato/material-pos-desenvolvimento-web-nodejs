import comTransacaoDeTeste from '../testes/transacao-de-teste';
import { fabricarEtiqueta, fabricarTarefa, fabricarUsuario } from '../testes/fabrica';
import { vincularEtiqueta } from './model';

describe('vincularEtiqueta', () => {
  it('deve cadastrar a etiqueta se ela ainda não existir', comTransacaoDeTeste(async (trx) => {
    const idUsuario = await fabricarUsuario(trx, { login: 'fulano' });
    const idTarefa = await fabricarTarefa(trx, { idUsuario });
    await vincularEtiqueta(idTarefa, 'youtube', 'fulano', trx);
    let res = await trx('etiquetas')
      .select(['id', 'descricao']);
    expect(res.length).toBe(1);
    expect(res[0].descricao).toBe('youtube');
    const idEtiqueta = res[0].id;
    res = await trx('tarefa_etiqueta')
      .select(['id_tarefa', 'id_etiqueta']);
    expect(res.length).toBe(1);
    expect(res[0].id_tarefa).toBe(idTarefa);
    expect(res[0].id_etiqueta).toBe(idEtiqueta);
  }));

  it('deve funcionar se a etiqueta já existir', comTransacaoDeTeste(async (trx) => {
    const idUsuario = await fabricarUsuario(trx, { login: 'fulano' });
    const idTarefa = await fabricarTarefa(trx, { idUsuario });
    const idEtiqueta = await fabricarEtiqueta(trx, { descricao: 'youtube' });
    await vincularEtiqueta(idTarefa, 'youtube', 'fulano', trx);
    const res = await trx('tarefa_etiqueta')
      .select(['id_tarefa', 'id_etiqueta']);
    expect(res.length).toBe(1);
    expect(res[0].id_tarefa).toBe(idTarefa);
    expect(res[0].id_etiqueta).toBe(idEtiqueta);
  }));
});

export default {};
