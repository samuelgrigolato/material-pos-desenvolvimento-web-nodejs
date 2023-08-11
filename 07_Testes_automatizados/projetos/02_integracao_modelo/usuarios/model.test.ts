import knex from '../shared/querybuilder';
import { alterarNome } from './model';


describe('usuarios/model', () => {

  describe('#alterarNome', () => {

    it('deve trocar o nome do usuário', async () => {
      await knex.transaction(async (trx) => {
        const usuario = {
          id: -1,
          nome: 'Clara',
          senha: '???',
          admin: false,
          login: 'clara',
        };
        await trx('usuarios').insert(usuario);
        await alterarNome(usuario, 'Aralc', trx);
        const usuarioAlterado = await trx('usuarios')
          .select('nome')
          .where({ id: -1 })
          .first();
        expect(usuarioAlterado).not.toBeUndefined();
        expect(usuarioAlterado?.nome).toEqual('Aralc');
        await trx.rollback(); // uma exceção já vai dar rollback
      });
    });

  });

});
