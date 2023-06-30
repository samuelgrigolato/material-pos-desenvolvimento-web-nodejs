import fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import fastifyPlugin from 'fastify-plugin';


const app = fastify({ logger: true });

app.register(fastifyPlugin(async function (instance, _opts) {

  instance.addHook('onRequest', async (_req, res) => {
    console.log('onRequestHook-dentro do plugin');
  });

  instance.get('/ping', async (_req, res) => {
    await res.send('pong\n');
  });

}));

app.register(fastifyStatic, {
  root: `${__dirname}/public`,
  prefix: '/public/',
});

app.addHook('onRequest', async (_req, res) => {
  console.log('onRequestHook');
  //res.status(403).send({ error: 'Não autorizado' });
});

app.addHook('preHandler', async (_req, _res) => {
  console.log('preHandlerHook');
});

app.addHook('onSend', async (_req, _res) => {
  console.log('onSendHook');
});

app.get('/usuario', async (_req, res) => {
  console.log('endpoint-inicio');
  await res.send({
    login: 'alguem',
    nome: 'Alguém'
  });
  console.log('endpoint-fim');
});

async function main() {
  try {
    await app.listen({ port: 3000 });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}
main();
