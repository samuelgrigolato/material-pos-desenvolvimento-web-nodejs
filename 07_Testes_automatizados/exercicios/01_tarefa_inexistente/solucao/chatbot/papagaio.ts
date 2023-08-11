import { Chatbot } from './api';


const chatbot: Chatbot = {
  perguntarListaDeFrases: async () => {
    return [
      'Frase 1',
      'Frase 2',
      'Frase 3',
    ];
  },
  perguntarFraseUnica: async () => 'Frase única',
  perguntarDuracaoDeTempo: async () => ({
    horas: 1,
    minutos: 30,
  }),
};

export default chatbot;
