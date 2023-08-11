import { Chatbot } from '../chatbot/api';
import knex from '../shared/querybuilder';
import { Usuario } from '../usuarios/model';
import { estimar, vincularEtiquetaNaTarefa } from './model';


describe('tarefas/model', () => {

  describe('#estimar', () => {

    it('deve retornar a estimativa no caso feliz', async () => {
      const usuario: Usuario = {
        id: 1,
        nome: 'Fulano',
        senha: '???',
        admin: false,
        login: 'fulano',
      };
      const idTarefa = 1;
      const tarefa = {
        id_usuario: 1,
        descricao: 'Tarefa X',
      }

      const uow = () => ({
        select: () => ({
          where: () => ({
            first: () => Promise.resolve(tarefa),
          })
        })
      });

      const chatbot: Chatbot = {
        perguntarFraseUnica: () => { throw new Error('Não deveria ter chamado') },
        perguntarListaDeFrases: () => { throw new Error('Não deveria ter chamado') },
        perguntarDuracaoDeTempo: async () => {
          return { horas: 1, minutos: 2 };
        }
      };

      const estimativa = await estimar(usuario, idTarefa, uow as any, chatbot);

      expect(estimativa).toEqual({ horas: 1, minutos: 2 });
    });

    it('deve retornar erro se o usuário não for o dono da tarefa', async () => {
      const usuario: Usuario = {
        id: 2,
        nome: 'Hackerman',
        senha: '???',
        admin: false,
        login: 'hackerman',
      };
      const idTarefa = 1;
      const tarefa = {
        id_usuario: 1,
        descricao: 'Tarefa X',
      }

      const uow = () => ({
        select: () => ({
          where: () => ({
            first: () => Promise.resolve(tarefa),
          })
        })
      });

      await expect(estimar(usuario, idTarefa, uow as any, null as any))
        .rejects.toThrowError('Acesso ao recurso solicitado foi negado');
    });

    it('deve retornar erro se a tarefa não existir', async () => {
      const idTarefa = 1;

      const uow = () => ({
        select: () => ({
          where: () => ({
            first: () => Promise.resolve(undefined),
          })
        })
      });

      await expect(estimar(null as any, idTarefa, uow as any, null as any))
        .rejects.toThrowError('Tarefa não encontrada');
    });

  });

  describe('#vincularEtiquetaNaTarefa', () => {

    it('deve vincular uma nova etiqueta na tarefa', async () => {
      await knex.transaction(async (trx) => {
        const usuario = {
          id: -1,
          nome: 'Fulano',
          senha: '???',
          admin: false,
          login: 'fulano',
        };
        await trx('usuarios').insert(usuario);
        await trx('categorias')
          .insert({
            id: -3,
            descricao: 'Categoria X',
          });
        const tarefa = {
          id: -2,
          descricao: 'Teste X',
          id_usuario: -1,
          data_conclusao: null,
          id_categoria: -3,
        };
        await trx('tarefas').insert(tarefa);
        const idTarefa = -2;
        const pre = await trx('etiquetas')
          .where({ descricao: 'inexistente-ate-agora' })
          .first();
        expect(pre).toBeUndefined(); // isso é uma checagem de sanidade
        await vincularEtiquetaNaTarefa(usuario, tarefa.id, 'inexistente-ate-agora', trx);
        const etiqueta = await trx('etiquetas')
          .select('id')
          .where({ descricao: 'inexistente-ate-agora' })
          .first();
        expect(etiqueta).not.toBeUndefined();
        const vinculo = await trx('tarefa_etiqueta')
          .where({ id_tarefa: idTarefa, id_etiqueta: etiqueta?.id })
          .first();
        expect(vinculo).not.toBeUndefined();
        await trx.rollback(); // uma exceção já vai dar rollback
      });
    });

  });

});
