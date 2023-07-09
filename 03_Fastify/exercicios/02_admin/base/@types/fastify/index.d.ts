import fastify from 'fastify'; // essa linha é muito importante! caso contrário ocorre uma substituição/shadowing do módulo fastify
import { Login } from 'usuarios/model';

declare module 'fastify' {
  interface FastifyRequest {
    loginDoUsuario: Login | null;
  }
}
