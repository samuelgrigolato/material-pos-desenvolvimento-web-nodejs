import fastify from 'fastify';

const app = fastify({ logger: true });

app.get('/hello', async (_req, _resp) => {
  return { hello: 'world' };
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
