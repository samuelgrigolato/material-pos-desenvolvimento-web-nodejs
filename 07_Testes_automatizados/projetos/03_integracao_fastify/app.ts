import openai from './chatbot/openai';
import uowPlugin from './core/uow';
import appFactory from './app-factory';


const app = appFactory(uowPlugin, openai);


async function main() {
  try {
    await app.listen({ port: 3000 });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}
main();
