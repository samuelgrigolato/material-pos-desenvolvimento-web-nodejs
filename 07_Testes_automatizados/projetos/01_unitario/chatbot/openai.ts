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
  },

  async perguntarDuracaoDeTempo(opcoesDePergunta) {
    return JSON.parse(await perguntar('O formato esperado da resposta é um JSON com os atributos horas e minutos da estimativa.', opcoesDePergunta));
  }

};

export default chatbot;
