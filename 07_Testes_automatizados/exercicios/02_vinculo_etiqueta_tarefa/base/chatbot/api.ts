
export interface OpcoesDePergunta {
  contexto?: string;
  entrada?: string;
}

export interface HoraMinuto {
  horas: number;
  minutos: number;
}

export interface Chatbot {
  perguntarListaDeFrases(opcoesDePergunta: OpcoesDePergunta): Promise<string[]>;
  perguntarFraseUnica(opcoesDePergunta: OpcoesDePergunta): Promise<string>;
  perguntarDuracaoDeTempo(opcoesDePergunta: OpcoesDePergunta): Promise<HoraMinuto>;
}
