# Integração com ChatGPT

No final de 2022 a área da inteligência artifical recebeu um produto de peso: o ChatGPT, da OpenAI. Um modelo conversacional baseado no GPT-3 (a época), capaz de responder a perguntas de modo similar a um humano.

Hoje em dia é raro um produto deste tipo não vir com uma "API", mas o que significa isso? O termo API significa "Application Programming Interface", é uma camada de abstração que permite que um software use outro para obter suas funcionalidades.

O que podemos esperar então da API do ChatGPT? Naturalmente devemos encontrar uma maneira de utilizar as capacidades de conversação de uma forma programática. Vamos explorar um pouco o portal da OpenAI para tentar entender suas capacidades:

1. Acesse https://platform.openai.com
2. Crie sua conta
3. Uma vez dentro da conta, acesse a funcionalidade "Manage Accounts" no menu do usuário no canto superior direito
4. Explore as seções "Usage", "Rate limits" e "API keys". Não deixe de criar uma chave de API para usar posteriormente nos exemplos de código.
6. Acesse e explore a seção "Documentation", principalmente a página "GPT best practices", onde existem muitas dicas sobre como extrair o máximo da API

Note que existe uma aba chamada "API Reference". Nela podemos encontrar de fato os "endpoints" que a API do ChatGPT nos oferece. No início existe uma documentação explicando como se autenticar (basta utilizar a API token como um token "Bearer", da mesma forma que fizemos no nosso próprio sistema de autenticação). Olhando a lista de endpoints disponíveis, o que mais parece se aproximar da API do Tafeito é o endpoint gerador de respostas: `POST /v1/chat/completions`.

Vamos focar agora no endpoint de geração de respostas. Ele aceita receber o histórico de mensagens prévias como entrada, e cada mensagem possui um campo chamado `role` (papel). Primeiramente vale observar que a API do ChatGPT não possui o conceito de "chat", ou seja, ela é completamente `stateless`. Essa foi uma decisão de design interessante da OpenAI, que simplificou o desenvolvimento da API consideravelmente para o lado deles. A questão do campo `role` permite que você indique para a API se a mensagem é uma instrução vinda do sistema (`system`), se é uma frase escrita pelo seu usuário (`user`) ou se é uma resposta prévia da API (`assistant`).

Agora que já vimos como a API funciona, precisamos pensar em maneiras de integrar sua funcionalidade no Tafeito. Temos pelo menos duas possibilidades aqui:

1. Apresentar um campo texto para o usuário descrever um objetivo/projeto e, com base no que ele escrever neste campo, sugerir uma lista de tarefas.
2. Sugerir uma tarefa com base no histórico recente do usuário.

Parece promissor. O próximo passo é entendermos quais seriam os endpoints na API do Tafeito que melhor entregariam essas funcionalidades para o front-end. Considere a seguinte proposta:

- POST /tarefas/planejar-projeto

Requisição:

```json
{
  "descricao": "Preciso fazer meu TCC."
}
```

Resposta:

```json
[
  "Tarefa 1",
  "Tarefa 2",
  "Tarefa 3"
]
```

- POST /tarefas/sugerir-proxima

Resposta:

```json
{
  "descricao": "Tarefa 3"
}
```

Vamos começar implementando esses endpoints no arquivo `tarefas/router.ts`. Note que delegaremos a responsabilidade de executar a geração das respostas para a camada de modelo `tarefas/model.ts`. Assim como passamos a unidade de trabalho para essa camada, vamos também criar uma instância de `chatbot` a partir de agora. Essa é uma nova dependência que será "injetada" de forma global.

```ts
import {
  consultarTarefaPeloId, cadastrarTarefa, consultarTarefas,
  DadosTarefa, concluirTarefa, reabrirTarefa, alterarTarefa,
  excluirTarefa, vincularEtiquetaNaTarefa, desvincularEtiquetaDaTarefa,
  planejarTarefasDoProjeto, sugerirProximaTarefa,
} from './model';

...

const planejarProjetoSchema: FastifySchema = {
  body: {
    type: 'object',
    properties: {
      descricao: { type: 'string' },
    },
    required: [ 'descricao' ],
  },
};

app.post('/planejar-projeto', { schema: planejarProjetoSchema }, async (req) => {
  const { descricao } = req.body as { descricao: string };
  const sugestoesDeTarefa = await planejarTarefasDoProjeto(descricao, req.chatbot);
  return sugestoesDeTarefa;
});

app.post('/sugerir-proxima', async (req) => {
  const sugestaoDeTarefa = await sugerirProximaTarefa(req.usuario, req.uow, req.chatbot);
  return {
    descricao: sugestaoDeTarefa,
  };
});
```

Ignore por enquanto o erro por conta da inexistência do atributo `chatbot` nas requisições do Fastify. Vamos agora implementar esses métodos no arquivo `tarefas/model.ts`. Repare que esse arquivo não vai incorporar nenhum conhecimento específico sobre o ChatGPT, vai apenas consumir capacidades oferecidas pela instância de um conceito chamado `Chatbot` (recebido por parâmetro):

```ts
import { Chatbot } from '../chatbot/api';

...

export async function planejarTarefasDoProjeto(descricao: string, chatbot: Chatbot): Promise<string[]> {
  return await chatbot.perguntarListaDeFrases({
    contexto: `Tafeito é um sistema de gestão de tarefas (TODO) individual.
      Você é um gerador de tarefas para o Tafeito. Uma tarefa do Tafeito é uma
      simples frase com no máximo 150 caracteres. Entenda a frase do usuário como
      o projeto/objetivo que ele deseja atingir e escreva 1 ou mais tarefas para
      o Tafeito.`,
    entrada: descricao,
  });
}

export async function sugerirProximaTarefa(usuario: Usuario, uow: Knex, chatbot: Chatbot): Promise<string> {
  const historico = await uow('tarefas')
    .select('descricao')
    .where('id_usuario', usuario.id)
    .orderBy('id', 'desc')
    .limit(10);
  return await chatbot.perguntarFraseUnica({
    contexto: `Tafeito é um sistema de gestão de tarefas (TODO) individual.
      Você é um gerador de tarefas para o Tafeito. Uma tarefa do Tafeito é uma
      simples frase com no máximo 150 caracteres. Você vai sugerir a tarefa que 
      faria mais sentido ser a próxima para este usuário, baseando-se nas seguintes
      tarefas presentes no seu histórico:

      ${historico.map(x => x.descricao).join('\n')}`,
  });
}
```

Vamos começar agora a trabalhar na pasta `chatbot`. Temos 3 coisas para fazer nela:

1. Criar um arquivo `api.ts` que expõe o contrato do que entendemos ser um bot conversacional:

```ts
export interface OpcoesDePergunta {
  contexto?: string;
  entrada?: string;
}

export interface Chatbot {
  perguntarListaDeFrases(opcoesDePergunta: OpcoesDePergunta): Promise<string[]>;
  perguntarFraseUnica(opcoesDePergunta: OpcoesDePergunta): Promise<string>;
}
```

2. Adicionar um arquivo `fastify-plugin.ts` que nos fornece uma maneira de acoplar uma definição de chatbot nas requisições Fastify:

```ts
import { FastifyInstance } from 'fastify';
import fastifyPlugin from 'fastify-plugin';

import { Chatbot } from './api';


export default (chatbot: Chatbot) => fastifyPlugin(async (app: FastifyInstance) => {
  app.decorateRequest('chatbot', null);
  app.addHook('preHandler', (req, _, done) => {
    req.chatbot = chatbot;
    done();
  });
});
```

3. Adicionar um arquivo chamado `openai.ts` com uma implementação de chatbot usando a API que exploramos no início dessa seção:

```commandline
$ npm install openai
```

```ts
import { ChatCompletionRequestMessage, Configuration, OpenAIApi } from 'openai';

import { Chatbot, OpcoesDePergunta } from './api';


const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);


async function perguntar(modeladorDeResposta: string, opcoesDePergunta: OpcoesDePergunta): Promise<string> {
  const messages: ChatCompletionRequestMessage[] = [
    { role: 'system', content: modeladorDeResposta }
  ];
  if (opcoesDePergunta.contexto) {
    messages.push({
      role: 'system',
      content: opcoesDePergunta.contexto,
    });
  }
  if (opcoesDePergunta.entrada) {
    messages.push({
      role: 'user',
      content: opcoesDePergunta.entrada,
    });
  }

  const response = await openai.createChatCompletion({
    model: 'gpt-3.5-turbo',
    messages,
  });

  const answer = response.data.choices[0];
  const answerContent = answer.message?.content;
  if (answerContent === undefined) {
    throw new Error('Não foi possível gerar uma resposta.');
  }
  return answerContent;
}


const chatbot: Chatbot = {

  async perguntarListaDeFrases(opcoesDePergunta) {
    return JSON.parse(await perguntar('A saída deve obrigatoriamente ser um vetor de strings formatado em JSON.', opcoesDePergunta));
  },

  async perguntarFraseUnica(opcoesDePergunta) {
    return await perguntar('A saída deve obrigatoriamente ser uma única frase.', opcoesDePergunta);
  }

};

export default chatbot;
```

Faltam duas coisas para terminar de conectar tudo. A primeira é adicionar a definição da propriedade `chatbot` no arquivo `fastify/index.d.ts`:

```ts
...
import { Chatbot } from 'chatbot/api';

declare module 'fastify' {
  interface FastifyRequest {
    ...

    chatbot: Chatbot;
  }
}
```

A segunda é instalar o plugin passando a instância do chatbot OpenAI, no arquivo `app.ts`:

```ts
import openai from './chatbot/openai';
import chatbotPlugin from './chatbot/fastify-plugin';

...

app.decorateRequest('usuario', null);
app.register(chatbotPlugin(openai));
```

Um dos benefícios de ter criado a abstração e injeção de um `chatbot` é a capacidade de criar várias implementações diferentes. Vamos adicionar uma nova implementação, em `chatbot/papagaio.ts`, para servir de implementação de testes:

```ts
import { Chatbot } from './api';


const chatbot: Chatbot = {
  perguntarListaDeFrases: async () => {
    return [
      'Frase 1',
      'Frase 2',
      'Frase 3',
    ];
  },
  perguntarFraseUnica: async () => 'Frase única'
};

export default chatbot;
```

Podemos facilmente substituir entre as duas no arquivo `app.ts`:

```ts
import openai from './chatbot/openai';
import papagaio from './chatbot/papagaio';

...

app.decorateRequest('usuario', null);
// app.register(chatbotPlugin(openai));
app.register(chatbotPlugin(papagaio));
```

Além de poupar dinheiro, esse tipo de design é essencial para facilitar a escrita de testes automatizados, como veremos na próxima seção.

[Exercício 01_estimativa](exercicios/01_estimativa/README.md)
