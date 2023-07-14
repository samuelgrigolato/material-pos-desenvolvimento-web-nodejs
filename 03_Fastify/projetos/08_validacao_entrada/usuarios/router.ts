import { FastifyInstance } from 'fastify';

import { autenticar, alterarNome } from './model';

export default async (app: FastifyInstance) => {

  app.post('/login', async (req, resp) => {
    const { login, senha } = req.body as { login: string, senha: string };
    const id = await autenticar(login, senha);
    return { token: id };
  });

  app.get('/autenticado', async (req, resp) => {
    return {
      usuario: {
        nome: req.usuario.nome,
        login: req.usuario.login,
        admin: req.usuario.admin,
      }
    }; // por que não retornamos o objeto req.usuario diretamente?
  });

  app.put('/autenticado/nome', async (req, resp) => {
    const { nome } = req.body as { nome: string };
    await alterarNome(req.usuario, nome);
    resp.status(204);
  });

};
